import EmailCampaign from "../models/EmailCampaign.js";
import EmailTarget from "../models/EmailTarget.js";
import ScrapingTarget from "../models/ScrapingTarget.js";

/**
 * Atomically claim the next pending email delivery job from MongoDB queue (FIFO)
 */
export const claimNextEmailTarget = async (campaignId) => {
  return await EmailTarget.findOneAndUpdate(
    {
      campaign: campaignId,
      status: "pending",
      $expr: { $lt: ["$attempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "sending",
        lastAttemptAt: new Date(),
      },
      $inc: { attempts: 1 },
    },
    {
      sort: { createdAt: 1 }, // FIFO
      new: true,
    }
  );
};

/**
 * Recover stale 'sending' jobs (e.g. from network dropout, sudden power loss, or server crash)
 */
export const recoverStaleSendingJobs = async (campaignId, staleMinutes = 5) => {
  const staleDate = new Date(Date.now() - staleMinutes * 60 * 1000);

  // Targets that exceeded maximum retries
  await EmailTarget.updateMany(
    {
      campaign: campaignId,
      status: "sending",
      lastAttemptAt: { $lte: staleDate },
      $expr: { $gte: ["$attempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "failed",
        errorMessage: "Dispatch timed out and exceeded maximum retries",
      },
    }
  );

  // Targets eligible for retry
  const result = await EmailTarget.updateMany(
    {
      campaign: campaignId,
      status: "sending",
      lastAttemptAt: { $lte: staleDate },
      $expr: { $lt: ["$attempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "pending",
      },
    }
  );

  return result.modifiedCount || 0;
};

/**
 * Mark email target as successfully sent
 */
export const markEmailSent = async (targetId) => {
  return await EmailTarget.findByIdAndUpdate(
    targetId,
    {
      $set: {
        status: "sent",
        sentAt: new Date(),
        errorMessage: null,
      },
    },
    { new: true }
  );
};

/**
 * Mark email target as failed
 */
export const markEmailFailed = async (targetId, errorMessage = "Sending failed") => {
  return await EmailTarget.findByIdAndUpdate(
    targetId,
    {
      $set: {
        status: "failed",
        errorMessage: String(errorMessage).slice(0, 500),
      },
    },
    { new: true }
  );
};

/**
 * Recalculate email campaign statistics atomically
 */
export const syncEmailCampaignStats = async (campaignId) => {
  const [counts] = await EmailTarget.aggregate([
    { $match: { campaign: campaignId } },
    {
      $group: {
        _id: null,
        totalEmails: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        sendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "sending"] }, 1, 0] },
        },
        sentCount: {
          $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
      },
    },
  ]);

  const stats = counts || {
    totalEmails: 0,
    pendingCount: 0,
    sendingCount: 0,
    sentCount: 0,
    failedCount: 0,
  };

  delete stats._id;

  const campaign = await EmailCampaign.findByIdAndUpdate(
    campaignId,
    { $set: { stats } },
    { new: true }
  );

  return campaign;
};

/**
 * Transfer scraped email leads from Scraping Campaign into Email Campaign
 */
export const importScrapedLeadsToCampaign = async (
  userId,
  emailCampaignId,
  { scrapingCampaignId, targetIds } = {}
) => {
  const query = {
    user: userId,
    status: "scraped",
    "emails.0": { $exists: true },
  };

  if (scrapingCampaignId) {
    query.campaign = scrapingCampaignId;
  }
  if (Array.isArray(targetIds) && targetIds.length > 0) {
    query._id = { $in: targetIds };
  }

  const scrapedTargets = await ScrapingTarget.find(query).select(
    "businessName websiteUrl place emails"
  );

  if (scrapedTargets.length === 0) {
    return { addedCount: 0, skippedCount: 0, totalEmails: 0 };
  }

  const bulkOps = [];
  const seenEmails = new Set();
  let candidateCount = 0;

  for (const st of scrapedTargets) {
    const emails = st.emails || [];
    for (const e of emails) {
      candidateCount++;
      const emailStr = (typeof e === "string" ? e : e.email || "").trim().toLowerCase();
      if (emailStr && !seenEmails.has(emailStr)) {
        seenEmails.add(emailStr);
        bulkOps.push({
          updateOne: {
            filter: {
              campaign: emailCampaignId,
              recipientEmail: emailStr,
            },
            update: {
              $setOnInsert: {
                user: userId,
                campaign: emailCampaignId,
                scrapingTarget: st._id,
                place: st.place,
                recipientEmail: emailStr,
                businessName: st.businessName,
                website: st.websiteUrl,
                status: "pending",
                attempts: 0,
              },
            },
            upsert: true,
          },
        });
      }
    }
  }

  let upsertedCount = 0;
  if (bulkOps.length > 0) {
    const result = await EmailTarget.bulkWrite(bulkOps, { ordered: false });
    upsertedCount = result.upsertedCount || 0;
  }

  const updatedCampaign = await syncEmailCampaignStats(emailCampaignId);

  return {
    addedCount: upsertedCount,
    skippedCount: candidateCount - upsertedCount,
    totalEmails: updatedCampaign?.stats?.totalEmails || 0,
    campaign: updatedCampaign,
  };
};

export default {
  claimNextEmailTarget,
  recoverStaleSendingJobs,
  markEmailSent,
  markEmailFailed,
  syncEmailCampaignStats,
  importScrapedLeadsToCampaign,
};
