import mongoose from "mongoose";
import ScrapingCampaign from "../models/ScrapingCampaign.js";
import ScrapingTarget from "../models/ScrapingTarget.js";
import Place from "../models/Place.js";

/**
 * Normalizes a URL and extracts its host domain
 */
export const normalizeDomain = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    let formatted = rawUrl.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `https://${formatted}`;
    }
    const parsed = new URL(formatted);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Ensures a valid web URL with protocol
 */
export const formatWebUrl = (rawUrl) => {
  if (!rawUrl) return null;
  let formatted = rawUrl.trim();
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }
  return formatted;
};

/**
 * Atomically claim the next pending target from the MongoDB queue (FIFO)
 */
export const claimNextTarget = async (campaignId) => {
  return await ScrapingTarget.findOneAndUpdate(
    {
      campaign: campaignId,
      status: "pending",
      $expr: { $lt: ["$attempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "processing",
        startedAt: new Date(),
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
 * Re-queue stale processing jobs (e.g. if the server crashed or network dropped mid-job)
 */
export const recoverStaleProcessingJobs = async (campaignId, staleThresholdMinutes = 5) => {
  const staleDate = new Date(Date.now() - staleThresholdMinutes * 60 * 1000);

  // Items that exceeded maxAttempts become failed
  await ScrapingTarget.updateMany(
    {
      campaign: campaignId,
      status: "processing",
      startedAt: { $lte: staleDate },
      $expr: { $gte: ["$attempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "failed",
        errorMessage: "Timed out and exceeded maximum retries",
        completedAt: new Date(),
      },
    }
  );

  // Items with remaining attempts are reset to pending
  const resetResult = await ScrapingTarget.updateMany(
    {
      campaign: campaignId,
      status: "processing",
      startedAt: { $lte: staleDate },
      $expr: { $lt: ["$attempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "pending",
        startedAt: null,
      },
    }
  );

  return resetResult.modifiedCount || 0;
};

/**
 * Mark a target as scraped and update place record
 */
export const markTargetScraped = async (targetId, { emails = [], pagesScanned = [] }) => {
  const target = await ScrapingTarget.findByIdAndUpdate(
    targetId,
    {
      $set: {
        status: "scraped",
        emails,
        pagesScanned,
        completedAt: new Date(),
        errorMessage: null,
      },
    },
    { new: true }
  );

  if (target && target.place && emails.length > 0) {
    const rawEmails = emails.map((e) => (typeof e === "string" ? e : e.email)).filter(Boolean);
    if (rawEmails.length > 0) {
      await Place.findByIdAndUpdate(target.place, {
        $addToSet: { emails: { $each: rawEmails } },
        $set: { emailScraped: true, lastScrapedAt: new Date() },
      });
    }
  }

  return target;
};

/**
 * Mark a target as failed
 */
export const markTargetFailed = async (targetId, errorMessage = "Scraping failed") => {
  return await ScrapingTarget.findByIdAndUpdate(
    targetId,
    {
      $set: {
        status: "failed",
        errorMessage: String(errorMessage).slice(0, 500),
        completedAt: new Date(),
      },
    },
    { new: true }
  );
};

/**
 * Recalculate campaign statistics atomically
 */
export const syncCampaignStats = async (campaignId) => {
  const objectId =
    campaignId instanceof mongoose.Types.ObjectId
      ? campaignId
      : new mongoose.Types.ObjectId(String(campaignId));

  const [counts] = await ScrapingTarget.aggregate([
    { $match: { campaign: objectId } },
    {
      $group: {
        _id: null,
        totalWebsites: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        processingCount: {
          $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
        },
        scrapedCount: {
          $sum: { $cond: [{ $eq: ["$status", "scraped"] }, 1, 0] },
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        emailsFoundCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "scraped"] },
                  { $gt: [{ $size: { $ifNull: ["$emails", []] } }, 0] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const stats = counts || {
    totalWebsites: 0,
    pendingCount: 0,
    processingCount: 0,
    scrapedCount: 0,
    failedCount: 0,
    emailsFoundCount: 0,
  };

  delete stats._id;

  const campaign = await ScrapingCampaign.findByIdAndUpdate(
    campaignId,
    { $set: { stats } },
    { new: true }
  );

  return campaign;
};
