import ScrapingCampaign from "../models/ScrapingCampaign.js";
import ScrapingTarget from "../models/ScrapingTarget.js";
import {
  claimNextTarget,
  markTargetScraped,
  markTargetFailed,
  recoverStaleProcessingJobs,
  syncCampaignStats,
} from "./scrapingQueueService.js";
import { scrapeWebsiteForEmails } from "./websiteScraperService.js";

// Tracks actively running campaign IDs in memory
const activeCampaigns = new Set();

/**
 * Worker loop for a single concurrency thread
 */
const runWorkerThread = async (campaignId) => {
  while (activeCampaigns.has(campaignId)) {
    // 1. Verify campaign is still in 'running' status in database
    const campaign = await ScrapingCampaign.findById(campaignId).select("status concurrency");
    if (!campaign || campaign.status !== "running") {
      activeCampaigns.delete(campaignId);
      break;
    }

    // 2. Claim next pending job atomically from MongoDB
    const target = await claimNextTarget(campaignId);

    if (!target) {
      // Check if there are other workers still processing items
      const remainingProcessing = await ScrapingTarget.countDocuments({
        campaign: campaignId,
        status: "processing",
      });

      if (remainingProcessing > 0) {
        // Wait briefly for other workers to finish
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      // No pending and no processing jobs remain: Campaign is completed!
      activeCampaigns.delete(campaignId);
      await ScrapingCampaign.findByIdAndUpdate(campaignId, {
        $set: {
          status: "completed",
          completedAt: new Date(),
        },
      });
      await syncCampaignStats(campaignId);
      break;
    }

    // 3. Execute website scraping
    try {
      const result = await scrapeWebsiteForEmails(target.websiteUrl);

      if (result.success) {
        await markTargetScraped(target._id, {
          emails: result.emails,
          pagesScanned: result.pagesScanned,
        });
      } else {
        await markTargetFailed(target._id, result.error || "Could not reach website");
      }
    } catch (err) {
      await markTargetFailed(target._id, err.message || "Scraping failed with unexpected error");
    }

    // 4. Update campaign stats atomically after each job
    await syncCampaignStats(campaignId);

    // Brief delay to be polite to external servers
    await new Promise((r) => setTimeout(r, 250));
  }
};

/**
 * Start or resume a campaign
 */
export const startCampaign = async (campaignId) => {
  const stringId = String(campaignId);

  // If already running in this process, skip re-trigger
  if (activeCampaigns.has(stringId)) {
    return await ScrapingCampaign.findById(stringId);
  }

  // Recover any stale processing jobs (e.g. from past server crash)
  await recoverStaleProcessingJobs(stringId);

  const campaign = await ScrapingCampaign.findById(stringId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Update status to running
  campaign.status = "running";
  if (!campaign.startedAt) {
    campaign.startedAt = new Date();
  }
  campaign.pausedAt = null;
  await campaign.save();

  activeCampaigns.add(stringId);

  const concurrency = Math.min(Math.max(campaign.concurrency || 3, 1), 6);

  // Spawn concurrent worker threads
  for (let i = 0; i < concurrency; i++) {
    runWorkerThread(stringId).catch((err) => {
      console.error(`Scraping worker error [Campaign: ${stringId}]:`, err);
    });
  }

  return await syncCampaignStats(stringId);
};

/**
 * Pause a running campaign
 */
export const pauseCampaign = async (campaignId) => {
  const stringId = String(campaignId);

  // Remove from active running set so workers stop picking up new jobs
  activeCampaigns.delete(stringId);

  const campaign = await ScrapingCampaign.findByIdAndUpdate(
    stringId,
    {
      $set: {
        status: "paused",
        pausedAt: new Date(),
      },
    },
    { new: true }
  );

  await syncCampaignStats(stringId);
  return campaign;
};

/**
 * Resume a paused campaign
 */
export const resumeCampaign = async (campaignId) => {
  return await startCampaign(campaignId);
};

/**
 * Check if a campaign is actively running
 */
export const isCampaignRunning = (campaignId) => {
  return activeCampaigns.has(String(campaignId));
};

export default {
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  isCampaignRunning,
};
