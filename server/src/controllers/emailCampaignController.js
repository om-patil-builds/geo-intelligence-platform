import EmailCampaign from "../models/EmailCampaign.js";
import EmailTarget from "../models/EmailTarget.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  importScrapedLeadsToCampaign,
  syncEmailCampaignStats,
} from "../services/emailQueueService.js";
import {
  startEmailCampaign,
  pauseEmailCampaign,
  resumeEmailCampaign,
  isEmailCampaignRunning,
} from "../services/emailWorkerService.js";
import { verifyGmailAccount } from "../services/gmailDispatcherService.js";

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
    isRunning: isEmailCampaignRunning(campaign._id),
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
 * Start sending email campaign
 * POST /api/email/campaigns/:id/start
 */
export const startEmailCampaignHandler = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Email campaign not found");
    error.statusCode = 404;
    throw error;
  }

  if (!campaign.subject || !campaign.templateBody) {
    const error = new Error("Please configure email subject line and template body before sending");
    error.statusCode = 400;
    throw error;
  }

  const updatedCampaign = await startEmailCampaign(campaign._id, req.user._id);

  res.status(200).json({
    success: true,
    message: "Email dispatch started",
    campaign: updatedCampaign,
  });
});

/**
 * Pause email campaign
 * POST /api/email/campaigns/:id/pause
 */
export const pauseEmailCampaignHandler = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Email campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedCampaign = await pauseEmailCampaign(campaign._id);

  res.status(200).json({
    success: true,
    message: "Email campaign paused",
    campaign: updatedCampaign,
  });
});

/**
 * Resume paused email campaign
 * POST /api/email/campaigns/:id/resume
 */
export const resumeEmailCampaignHandler = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    const error = new Error("Email campaign not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedCampaign = await resumeEmailCampaign(campaign._id, req.user._id);

  res.status(200).json({
    success: true,
    message: "Email campaign resumed",
    campaign: updatedCampaign,
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

  await pauseEmailCampaign(campaign._id);

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
    isRunning: isEmailCampaignRunning(campaign._id),
    progressPercent,
    recentActivity,
  });
});

/**
 * Stream email campaign live progress via SSE
 * GET /api/email/campaigns/:id/stream
 */
export const streamEmailCampaignProgress = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!campaign) {
    return res.status(404).json({ success: false, message: "Campaign not found" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`data: ${JSON.stringify({ type: "connected", campaignId: campaign._id })}\n\n`);

  const sendUpdate = async () => {
    try {
      const current = await EmailCampaign.findById(campaign._id).select(
        "status stats startedAt completedAt pausedAt"
      );
      if (!current) return;

      const total = current.stats.totalEmails || 0;
      const processed = (current.stats.sentCount || 0) + (current.stats.failedCount || 0);
      const progressPercent = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;

      const recentActivity = await EmailTarget.find({ campaign: campaign._id })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("recipientEmail businessName status updatedAt errorMessage");

      res.write(
        `data: ${JSON.stringify({
          type: "progress",
          status: current.status,
          stats: current.stats,
          progressPercent,
          isRunning: isEmailCampaignRunning(campaign._id),
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

  await sendUpdate();
  const intervalId = setInterval(sendUpdate, 2000);

  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
});

/**
 * Get user's current Gmail settings
 * GET /api/email/settings/gmail
 */
export const getGmailSettingsHandler = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("gmailSettings");

  res.status(200).json({
    success: true,
    gmailSettings: {
      email: user?.gmailSettings?.email || null,
      senderName: user?.gmailSettings?.senderName || null,
      isConnected: Boolean(user?.gmailSettings?.isConnected),
      lastTestedAt: user?.gmailSettings?.lastTestedAt || null,
    },
  });
});

/**
 * Configure and verify user's Gmail App Password
 * POST /api/email/settings/gmail
 */
export const updateGmailSettingsHandler = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const appPassword = String(req.body.appPassword || "").trim();
  const senderName = String(req.body.senderName || "").trim();

  if (!email || !appPassword) {
    const error = new Error("Gmail address and App Password are required");
    error.statusCode = 400;
    throw error;
  }

  // Verify against Google SMTP
  try {
    await verifyGmailAccount(email, appPassword);
  } catch (verifyErr) {
    const error = new Error(
      `Gmail authentication failed: ${verifyErr.message || "Invalid credentials"}. Please ensure 2-Step Verification is enabled and use a 16-character Google App Password.`
    );
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(req.user._id);
  user.gmailSettings = {
    email,
    appPassword,
    senderName: senderName || user.name,
    isConnected: true,
    lastTestedAt: new Date(),
  };
  await user.save();

  res.status(200).json({
    success: true,
    message: "Gmail account verified and connected successfully",
    gmailSettings: {
      email: user.gmailSettings.email,
      senderName: user.gmailSettings.senderName,
      isConnected: true,
      lastTestedAt: user.gmailSettings.lastTestedAt,
    },
  });
});

/**
 * Disconnect Gmail account
 * POST /api/email/settings/disconnect-gmail
 */
export const disconnectGmailHandler = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.gmailSettings = {
      email: null,
      appPassword: null,
      senderName: null,
      isConnected: false,
      lastTestedAt: null,
    };
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: "Gmail account disconnected successfully",
  });
});
