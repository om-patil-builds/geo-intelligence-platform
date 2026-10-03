import EmailCampaign from "../models/EmailCampaign.js";
import EmailTarget from "../models/EmailTarget.js";
import EmailAccount from "../models/EmailAccount.js";
import EmailThread from "../models/EmailThread.js";
import EmailMessage from "../models/EmailMessage.js";
import {
  claimNextEmailTarget,
  recoverStaleSendingJobs,
  markEmailSent,
  markEmailFailed,
  syncEmailCampaignStats,
} from "./emailQueueService.js";
import {
  sendEmail,
  interpolateTemplate,
} from "./gmailApiService.js";

// Set of actively running campaign IDs in memory
const activeEmailCampaigns = new Set();

/**
 * Worker loop executing email dispatches for a campaign via Gmail API
 */
const runEmailWorkerLoop = async (campaignId, userId) => {
  const stringId = String(campaignId);

  try {
    // 1. Resolve connected EmailAccount
    let campaign = await EmailCampaign.findById(stringId);
    if (!campaign) return;

    let emailAccount = null;
    if (campaign.emailAccount) {
      emailAccount = await EmailAccount.findOne({
        _id: campaign.emailAccount,
        user: userId,
        isConnected: true,
      }).select("+encryptedRefreshToken +accessToken");
    }

    if (!emailAccount) {
      emailAccount = await EmailAccount.findOne({
        user: userId,
        isConnected: true,
      }).select("+encryptedRefreshToken +accessToken");
    }

    if (!emailAccount) {
      throw new Error(
        "No active Gmail account connected via Google OAuth. Please authorize your Gmail account."
      );
    }

    // Attach emailAccount to campaign if missing
    if (!campaign.emailAccount) {
      campaign.emailAccount = emailAccount._id;
      await campaign.save();
    }

    while (activeEmailCampaigns.has(stringId)) {
      // 2. Verify campaign is still in 'sending' status
      campaign = await EmailCampaign.findById(stringId);
      if (!campaign || campaign.status !== "sending") {
        activeEmailCampaigns.delete(stringId);
        break;
      }

      // 3. Atomically claim next pending target (FIFO)
      const target = await claimNextEmailTarget(stringId);

      if (!target) {
        // Check if other workers or requests are still in-flight
        const remainingSending = await EmailTarget.countDocuments({
          campaign: stringId,
          status: "sending",
        });

        if (remainingSending > 0) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        // All queued emails dispatched: Campaign Completed!
        activeEmailCampaigns.delete(stringId);
        await EmailCampaign.findByIdAndUpdate(stringId, {
          $set: {
            status: "completed",
            completedAt: new Date(),
          },
        });
        await syncEmailCampaignStats(stringId);
        break;
      }

      // Idempotency: verify target hasn't already been sent
      if (target.sentAt && target.status === "sent") {
        continue;
      }

      // 4. Prepare personalized template content
      const templateContext = {
        businessName: target.businessName || "Business Owner",
        website: target.website || "",
        recipientEmail: target.recipientEmail,
        email: target.recipientEmail,
        senderName: emailAccount.senderName || emailAccount.email,
      };

      const personalizedSubject = interpolateTemplate(
        campaign.subject || "Collaboration Opportunity",
        templateContext
      );
      const personalizedBody = interpolateTemplate(
        campaign.templateBody || "Hi,\n\nWe would love to connect with your team.",
        templateContext
      );

      // 5. Dispatch email via Gmail API
      try {
        const sendResult = await sendEmail({
          emailAccount,
          to: target.recipientEmail,
          subject: personalizedSubject,
          textBody: personalizedBody,
        });

        await markEmailSent(target._id, {
          gmailMessageId: sendResult.messageId,
          gmailThreadId: sendResult.threadId,
        });

        // 6. Record in EmailThread and EmailMessage for future Inbox capabilities
        try {
          let thread = null;
          if (sendResult.threadId) {
            thread = await EmailThread.findOne({
              emailAccount: emailAccount._id,
              gmailThreadId: sendResult.threadId,
            });

            if (!thread) {
              thread = await EmailThread.create({
                user: userId,
                emailAccount: emailAccount._id,
                gmailThreadId: sendResult.threadId,
                subject: personalizedSubject,
                snippet: personalizedBody.slice(0, 120),
                participants: [
                  { name: emailAccount.senderName, email: emailAccount.email },
                  { name: target.businessName, email: target.recipientEmail },
                ],
                lastMessageAt: new Date(),
                messageCount: 1,
                campaign: campaign._id,
              });
            } else {
              thread.lastMessageAt = new Date();
              thread.messageCount += 1;
              await thread.save();
            }
          }

          await EmailMessage.create({
            user: userId,
            emailAccount: emailAccount._id,
            thread: thread?._id || null,
            gmailMessageId: sendResult.messageId,
            gmailThreadId: sendResult.threadId || "",
            direction: "outbound",
            from: { name: emailAccount.senderName, email: emailAccount.email },
            to: [{ name: target.businessName, email: target.recipientEmail }],
            subject: personalizedSubject,
            snippet: personalizedBody.slice(0, 120),
            bodyText: personalizedBody,
            sentAt: new Date(),
            campaign: campaign._id,
            campaignTarget: target._id,
          });
        } catch (inboxIndexErr) {
          console.warn("Could not save to inbox thread:", inboxIndexErr.message);
        }
      } catch (sendErr) {
        console.error(`Gmail API send failed for [${target.recipientEmail}]:`, sendErr.message);

        // Check if user revoked account authorization in Google Account
        if (sendErr.message === "GMAIL_AUTH_REVOKED" || sendErr.code === 401) {
          activeEmailCampaigns.delete(stringId);
          await markEmailFailed(target._id, "Gmail OAuth authorization revoked by user");
          await EmailCampaign.findByIdAndUpdate(stringId, {
            $set: {
              status: "paused",
              lastError: "Gmail account authorization was revoked. Please reconnect your account via Google OAuth.",
            },
          });
          await syncEmailCampaignStats(stringId);
          break;
        }

        // Handle Gmail rate limits or temporary errors
        if (sendErr.code === 429 || sendErr.message?.includes("User Rate Limit Exceeded")) {
          console.warn("Gmail API Rate limit hit. Backing off for 10 seconds...");
          await new Promise((r) => setTimeout(r, 10000));
        }

        await markEmailFailed(target._id, sendErr.message || "Failed to dispatch email via Gmail API");
      }

      // 7. Update campaign statistics after each send
      await syncEmailCampaignStats(stringId);

      // 8. Enforce safe throttle delay between sends (default 3 seconds)
      const delayMs = Math.max((campaign.sendDelaySeconds || 3) * 1000, 1000);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  } catch (fatalErr) {
    console.error(`Fatal email campaign worker error [Campaign: ${stringId}]:`, fatalErr);
    activeEmailCampaigns.delete(stringId);
    await EmailCampaign.findByIdAndUpdate(stringId, {
      $set: {
        status: "failed",
        lastError: fatalErr.message,
      },
    });
    await syncEmailCampaignStats(stringId);
  }
};

/**
 * Start or resume an email outreach campaign
 */
export const startEmailCampaign = async (campaignId, userId) => {
  const stringId = String(campaignId);

  if (activeEmailCampaigns.has(stringId)) {
    return await EmailCampaign.findById(stringId);
  }

  // Recover any stale sending jobs from past network drops or server restarts
  await recoverStaleSendingJobs(stringId);

  const campaign = await EmailCampaign.findById(stringId);
  if (!campaign) {
    throw new Error("Email campaign not found");
  }

  // Verify connected EmailAccount exists for user
  const emailAccount = await EmailAccount.findOne({
    user: userId,
    isConnected: true,
  });

  if (!emailAccount) {
    throw new Error("Please connect your Gmail account via Google OAuth before launching an outreach campaign.");
  }

  // Associate campaign with emailAccount if not already set
  if (!campaign.emailAccount) {
    campaign.emailAccount = emailAccount._id;
  }

  campaign.status = "sending";
  if (!campaign.startedAt) {
    campaign.startedAt = new Date();
  }
  campaign.pausedAt = null;
  await campaign.save();

  activeEmailCampaigns.add(stringId);

  // Spawn background worker loop
  runEmailWorkerLoop(stringId, userId).catch((err) => {
    console.error(`Email campaign worker loop error [${stringId}]:`, err);
  });

  return await syncEmailCampaignStats(stringId);
};

/**
 * Pause an email campaign
 */
export const pauseEmailCampaign = async (campaignId) => {
  const stringId = String(campaignId);

  activeEmailCampaigns.delete(stringId);

  const campaign = await EmailCampaign.findByIdAndUpdate(
    stringId,
    {
      $set: {
        status: "paused",
        pausedAt: new Date(),
      },
    },
    { new: true }
  );

  await syncEmailCampaignStats(stringId);
  return campaign;
};

/**
 * Resume a paused email campaign
 */
export const resumeEmailCampaign = async (campaignId, userId) => {
  return await startEmailCampaign(campaignId, userId);
};

/**
 * Check if email campaign is currently sending
 */
export const isEmailCampaignRunning = (campaignId) => {
  return activeEmailCampaigns.has(String(campaignId));
};

export default {
  startEmailCampaign,
  pauseEmailCampaign,
  resumeEmailCampaign,
  isEmailCampaignRunning,
};
