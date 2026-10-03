import ScrapingCampaign from "../models/ScrapingCampaign.js";
import ScrapingTarget from "../models/ScrapingTarget.js";
import Place from "../models/Place.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  normalizeDomain,
  formatWebUrl,
  syncCampaignStats,
} from "../services/scrapingQueueService.js";
import scrapingWorkerService, {
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  isCampaignRunning,
} from "../services/scrapingWorkerService.js";

/**
 * Create a new scraping campaign
 * POST /api/scraping/campaigns
 */
export const createCampaign = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const topic = String(req.body.topic || "").trim();
  const concurrency = Number(req.body.concurrency || 3);

  if (!name || !topic) {
    const error = new Error("Campaign name and topic/category are required");
    error.statusCode = 400;
    throw error;
  }

  const campaign = await ScrapingCampaign.create({
    user: req.user._id,
    name,
    topic,
    concurrency: Math.min(Math.max(concurrency, 1), 6),
    status: "draft",
  });

  res.status(201).json({
    success: true,
    message: "Scraping campaign created successfully",
    campaign,
  });
});

/**
 * List all campaigns for current user
 * GET /api/scraping/campaigns
 */
export const listCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await ScrapingCampaign.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    campaigns,
  });
});

/**
 * Get campaign by ID with target details
 * GET /api/scraping/campaigns/:id
 */
export const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await ScrapingCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }

  // Ensure statistics are completely fresh and accurate
  const freshCampaign = (await syncCampaignStats(campaign._id)) || campaign;

  const { status, page = 1, limit = 50 } = req.query;
  const filter = { campaign: campaign._id };
  if (status && status !== "all") {
    filter.status = status;
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const pageLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const [targets, totalTargets] = await Promise.all([
    ScrapingTarget.find(filter)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * pageLimit)
      .limit(pageLimit),
    ScrapingTarget.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    campaign: freshCampaign,
    isRunning: isCampaignRunning(campaign._id),
    targets,
    pagination: {
      total: totalTargets,
      page: pageNum,
      pages: Math.ceil(totalTargets / pageLimit),
      limit: pageLimit,
    },
  });
});

/**
 * Add discovered places with websites to a campaign
 * POST /api/scraping/campaigns/:id/add-places
 */
export const addPlacesToCampaign = asyncHandler(async (req, res) => {
  const campaign = await ScrapingCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const { placeIds = [] } = req.body;

  if (!Array.isArray(placeIds) || placeIds.length === 0) {
    const error = new Error("placeIds array is required");
    error.statusCode = 400;
    throw error;
  }

  // Fetch places belonging to this user with valid websites
  const places = await Place.find({
    _id: { $in: placeIds },
    user: req.user._id,
    website: { $ne: null },
  }).select("name website");

  if (places.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No places with valid websites found among provided IDs",
      addedCount: 0,
      skippedCount: placeIds.length,
      totalWebsites: campaign.stats.totalWebsites,
    });
  }

  // Build bulk upsert operations to avoid duplicates within this campaign
  const bulkOps = [];
  const seenDomains = new Set();

  for (const p of places) {
    const domain = normalizeDomain(p.website);
    const validUrl = formatWebUrl(p.website);

    if (domain && validUrl && !seenDomains.has(domain)) {
      seenDomains.add(domain);
      bulkOps.push({
        updateOne: {
          filter: {
            campaign: campaign._id,
            normalizedDomain: domain,
          },
          update: {
            $setOnInsert: {
              user: req.user._id,
              campaign: campaign._id,
              place: p._id,
              businessName: p.name,
              websiteUrl: validUrl,
              normalizedDomain: domain,
              status: "pending",
              attempts: 0,
            },
          },
          upsert: true,
        },
      });
    }
  }

  let upsertedCount = 0;
  if (bulkOps.length > 0) {
    const result = await ScrapingTarget.bulkWrite(bulkOps, { ordered: false });
    upsertedCount = result.upsertedCount || 0;
  }

  // Re-synchronize campaign stats
  const updatedCampaign = await syncCampaignStats(campaign._id);

  res.status(200).json({
    success: true,
    message: `Added ${upsertedCount} new website(s) to campaign`,
    addedCount: upsertedCount,
    skippedCount: placeIds.length - upsertedCount,
    campaign: updatedCampaign,
  });
});

/**
 * Start scraping campaign
 * POST /api/scraping/campaigns/:id/start
 */
export const startCampaignHandler = asyncHandler(async (req, res) => {
  const campaign = await ScrapingCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedCampaign = await startCampaign(campaign._id);

  res.status(200).json({
    success: true,
    message: "Campaign scraping started",
    campaign: updatedCampaign,
  });
});

/**
 * Pause scraping campaign
 * POST /api/scraping/campaigns/:id/pause
 */
export const pauseCampaignHandler = asyncHandler(async (req, res) => {
  const campaign = await ScrapingCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedCampaign = await pauseCampaign(campaign._id);

  res.status(200).json({
    success: true,
    message: "Campaign scraping paused",
    campaign: updatedCampaign,
  });
});

/**
 * Resume scraping campaign
 * POST /api/scraping/campaigns/:id/resume
 */
export const resumeCampaignHandler = asyncHandler(async (req, res) => {
  const campaign = await ScrapingCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedCampaign = await resumeCampaign(campaign._id);

  res.status(200).json({
    success: true,
    message: "Campaign scraping resumed",
    campaign: updatedCampaign,
  });
});

/**
 * Delete scraping campaign and its targets
 * DELETE /api/scraping/campaigns/:id
 */
export const deleteCampaignHandler = asyncHandler(async (req, res) => {
  const campaign = await ScrapingCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }

  // Stop worker if currently running
  await pauseCampaign(campaign._id);

  await Promise.all([
    ScrapingTarget.deleteMany({ campaign: campaign._id }),
    ScrapingCampaign.deleteOne({ _id: campaign._id }),
  ]);

  res.status(200).json({
    success: true,
    message: "Campaign and targets deleted successfully",
  });
});

/**
 * Lightweight polling endpoint for live progress
 * GET /api/scraping/campaigns/:id/progress
 */
export const getCampaignProgress = asyncHandler(async (req, res) => {
  const campaign = await ScrapingCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const freshCampaign = (await syncCampaignStats(campaign._id)) || campaign;

  // Fetch the 5 most recently updated targets for live feed
  const recentActivity = await ScrapingTarget.find({ campaign: campaign._id })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select("businessName websiteUrl status emails updatedAt errorMessage");

  const total = freshCampaign.stats.totalWebsites || 0;
  const processed = (freshCampaign.stats.scrapedCount || 0) + (freshCampaign.stats.failedCount || 0);
  const progressPercent = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;

  res.status(200).json({
    success: true,
    campaign: freshCampaign,
    isRunning: isCampaignRunning(campaign._id),
    progressPercent,
    recentActivity,
  });
});

/**
 * Server-Sent Events (SSE) live progress stream
 * GET /api/scraping/campaigns/:id/stream
 */
export const streamCampaignProgress = asyncHandler(async (req, res) => {
  const campaign = await ScrapingCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    return res.status(404).json({ success: false, message: "Campaign not found" });
  }

  // Setup SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disables Nginx buffering if deployed
  });

  res.write(`data: ${JSON.stringify({ type: "connected", campaignId: campaign._id })}\n\n`);

  const sendUpdate = async () => {
    try {
      let current = await ScrapingCampaign.findById(campaign._id).select(
        "status stats startedAt completedAt pausedAt"
      );
      if (!current) return;

      if (isCampaignRunning(campaign._id)) {
        const synced = await syncCampaignStats(campaign._id);
        if (synced) current = synced;
      }

      const total = current.stats.totalWebsites || 0;
      const processed = (current.stats.scrapedCount || 0) + (current.stats.failedCount || 0);
      const progressPercent = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;

      const recentActivity = await ScrapingTarget.find({ campaign: campaign._id })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("businessName websiteUrl status emails updatedAt errorMessage");

      res.write(
        `data: ${JSON.stringify({
          type: "progress",
          status: current.status,
          stats: current.stats,
          progressPercent,
          isRunning: isCampaignRunning(campaign._id),
          recentActivity,
        })}\n\n`
      );

      if (current.status === "completed" || current.status === "failed") {
        res.write(`data: ${JSON.stringify({ type: "ended", status: current.status })}\n\n`);
      }
    } catch (err) {
      console.error("SSE stream error:", err.message);
    }
  };

  // Immediate update
  await sendUpdate();

  // Send update every 2 seconds
  const intervalId = setInterval(sendUpdate, 2000);

  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
});
