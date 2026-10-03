import EmailCampaign from "../models/EmailCampaign.js";
import EmailTarget from "../models/EmailTarget.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  importScrapedLeadsToCampaign,
  syncEmailCampaignStats,
} from "../services/emailQueueService.js";

/**
 * Create a new Email Outreach Campaign
 * POST /api/email/campaigns
 */
export const createEmailCampaign = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const category = String(req.body.category || "").trim();
  const subject = String(req.body.subject || "").trim();
  const templateBody = String(req.body.templateBody || "").trim();
  const sendDelaySeconds = Math.min(Math.max(Number(req.body.sendDelaySeconds || 3), 1), 60);

  if (!name || !category) {
    const error = new Error("Campaign name and category/topic are required");
    error.statusCode = 400;
    throw error;
  }

  const campaign = await EmailCampaign.create({
    user: req.user._id,
    name,
    category,
    subject,
    templateBody,
    sendDelaySeconds,
    status: "draft",
  });

  res.status(201).json({
    success: true,
    message: "Email outreach campaign created successfully",
    campaign,
  });
});

/**
 * List all email campaigns for user
 * GET /api/email/campaigns
 */
export const listEmailCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await EmailCampaign.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    campaigns,
  });
});

/**
 * Get email campaign by ID with target recipients
 * GET /api/email/campaigns/:id
 */
export const getEmailCampaignById = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Email campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const { status, page = 1, limit = 50 } = req.query;
  const filter = { campaign: campaign._id };
  if (status && status !== "all") {
    filter.status = status;
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const pageLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  const [targets, totalTargets] = await Promise.all([
    EmailTarget.find(filter)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * pageLimit)
      .limit(pageLimit),
    EmailTarget.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    campaign,
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
 * Update email campaign settings (subject, body, delay)
 * PUT /api/email/campaigns/:id
 */
export const updateEmailCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Email campaign not found");
    error.statusCode = 404;
    throw error;
  }

  if (req.body.name) campaign.name = String(req.body.name).trim();
  if (req.body.category) campaign.category = String(req.body.category).trim();
  if (req.body.subject !== undefined) campaign.subject = String(req.body.subject).trim();
  if (req.body.templateBody !== undefined) campaign.templateBody = String(req.body.templateBody);
  if (req.body.sendDelaySeconds) {
    campaign.sendDelaySeconds = Math.min(Math.max(Number(req.body.sendDelaySeconds), 1), 60);
  }

  await campaign.save();

  res.status(200).json({
    success: true,
    message: "Email campaign updated successfully",
    campaign,
  });
});

/**
 * Import discovered email leads from a scraping campaign into this email campaign
 * POST /api/email/campaigns/:id/import-leads
 */
export const importLeadsHandler = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Email campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const { scrapingCampaignId, targetIds } = req.body;

  const result = await importScrapedLeadsToCampaign(req.user._id, campaign._id, {
    scrapingCampaignId,
    targetIds,
  });

  res.status(200).json({
    success: true,
    message: `Imported ${result.addedCount} new email lead(s) into campaign`,
    addedCount: result.addedCount,
    skippedCount: result.skippedCount,
    totalEmails: result.totalEmails,
    campaign: result.campaign,
  });
});

/**
 * Delete email campaign and targets
 * DELETE /api/email/campaigns/:id
 */
export const deleteEmailCampaignHandler = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Email campaign not found");
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    EmailTarget.deleteMany({ campaign: campaign._id }),
    EmailCampaign.deleteOne({ _id: campaign._id }),
  ]);

  res.status(200).json({
    success: true,
    message: "Email campaign deleted successfully",
  });
});

/**
 * Get live email dispatch progress
 * GET /api/email/campaigns/:id/progress
 */
export const getEmailCampaignProgress = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).select("name category status stats startedAt completedAt pausedAt");

  if (!campaign) {
    const error = new Error("Email campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const total = campaign.stats.totalEmails || 0;
  const processed = (campaign.stats.sentCount || 0) + (campaign.stats.failedCount || 0);
  const progressPercent = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;

  const recentActivity = await EmailTarget.find({ campaign: campaign._id })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select("recipientEmail businessName status updatedAt errorMessage");

  res.status(200).json({
    success: true,
    campaign,
    progressPercent,
    recentActivity,
  });
});
