import EmailCampaign from "../models/EmailCampaign.js";
import EmailTarget from "../models/EmailTarget.js";
import User from "../models/User.js";
import {
  claimNextEmailTarget,
  recoverStaleSendingJobs,
  markEmailSent,
  markEmailFailed,
  syncEmailCampaignStats,
} from "./emailQueueService.js";
import {
  createGmailTransporter,
  interpolateTemplate,
  sendEmailMessage,
} from "./gmailDispatcherService.js";

// Set of actively running campaign IDs in memory
const activeEmailCampaigns = new Set();

/**
 * Worker loop executing email dispatches for a campaign
 */
const runEmailWorkerLoop = async (campaignId, userId) => {
  const stringId = String(campaignId);

  try {
    const user = await User.findById(userId);
    if (!user?.gmailSettings?.email || !user?.gmailSettings?.appPassword) {
      throw new Error("User has not configured Gmail credentials");
    }

    const transporter = await createGmailTransporter(
      user.gmailSettings.email,
      user.gmailSettings.appPassword
    );

    while (activeEmailCampaigns.has(stringId)) {
      // 1. Verify campaign is still active in database
      const campaign = await EmailCampaign.findById(stringId);
      if (!campaign || campaign.status !== "sending") {
        activeEmailCampaigns.delete(stringId);
        break;
      }

      // 2. Claim next pending email job atomically from MongoDB queue (FIFO)
      const target = await claimNextEmailTarget(stringId);

      if (!target) {
        // Check if other items are still sending
        const remainingSending = await EmailTarget.countDocuments({
          campaign: stringId,
          status: "sending",
        });

        if (remainingSending > 0) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        // All items have been processed: Campaign Completed!
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

      // 3. Prepare personalized template content
      const templateContext = {
        businessName: target.businessName || "Business Owner",
        website: target.website || "",
        recipientEmail: target.recipientEmail,
        email: target.recipientEmail,
        senderName: user.gmailSettings.senderName || user.name || "",
      };

      const personalizedSubject = interpolateTemplate(
        campaign.subject || "Collaboration Opportunity",
        templateContext
      );
      const personalizedBody = interpolateTemplate(
        campaign.templateBody || "Hi,\n\nWe would love to connect with your team.",
        templateContext
      );

      // 4. Dispatch email via authenticated Gmail SMTP
      try {
        await sendEmailMessage({
          transporter,
          fromEmail: user.gmailSettings.email,
          senderName: user.gmailSettings.senderName || user.name,
          toEmail: target.recipientEmail,
          subject: personalizedSubject,
          textBody: personalizedBody,
        });

        await markEmailSent(target._id);
      } catch (sendErr) {
        console.error(`Email dispatch error for [${target.recipientEmail}]:`, sendErr.message);
        await markEmailFailed(target._id, sendErr.message || "Failed to dispatch email");
      }

      // 5. Update campaign statistics after each send
      await syncEmailCampaignStats(stringId);

      // 6. Enforce safe throttle delay between sends (default 3 seconds)
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

  const user = await User.findById(userId);
  if (!user?.gmailSettings?.isConnected) {
    throw new Error("Please connect your Gmail account in Email Settings before launching a campaign");
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
    console.error(`Email campaign worker crashed [${stringId}]:`, err);
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
