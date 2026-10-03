import EmailCampaign from "../models/EmailCampaign.js";
import EmailTarget from "../models/EmailTarget.js";
import EmailAccount from "../models/EmailAccount.js";
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
import {
  getAuthorizationUrl,
  handleOAuthCallback,
} from "../services/gmailApiService.js";
import { encryptText } from "../utils/cryptoUtils.js";

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

  const targetCount = await EmailTarget.countDocuments({ campaign: campaign._id });
  if (targetCount === 0) {
    const error = new Error("Please import or add at least one recipient lead before starting the email campaign.");
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
 * Get Google OAuth Authorization URL
 * GET /api/email/oauth/google/url
 */
export const getGoogleAuthUrlHandler = asyncHandler(async (req, res) => {
  const returnUrl = req.query.returnUrl || "/email";

  let clientOrigin = req.query.clientOrigin || req.headers.origin;
  if (!clientOrigin && req.headers.referer) {
    try {
      clientOrigin = new URL(req.headers.referer).origin;
    } catch {
      // ignore
    }
  }

  // Ensure localhost URLs use http instead of https
  if (clientOrigin && (clientOrigin.startsWith("https://localhost") || clientOrigin.startsWith("https://127.0.0.1"))) {
    clientOrigin = clientOrigin.replace(/^https:/, "http:");
  }

  const url = getAuthorizationUrl({
    userId: req.user._id.toString(),
    returnUrl,
    clientOrigin,
  });

  res.status(200).json({ success: true, url });
});

/**
 * Handle Google OAuth callback redirect from Google consent screen
 * GET /api/email/oauth/google/callback
 * (Public endpoint - user is authenticated via state token)
 */
export const handleGoogleAuthCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  let parsedState = {};
  if (state) {
    try {
      const decodedStr = Buffer.from(decodeURIComponent(state), "base64url").toString("utf-8");
      parsedState = JSON.parse(decodedStr);
    } catch {
      try {
        const decodedStr = Buffer.from(state, "base64url").toString("utf-8");
        parsedState = JSON.parse(decodedStr);
      } catch (e2) {
        console.error("Failed to parse OAuth state:", e2.message, "raw state:", state);
      }
    }
  }

  // Resolve client frontend base URL safely
  let clientBase = parsedState.clientOrigin;
  if (!clientBase) {
    const origins = (process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const isLocalServer =
      (process.env.SERVER_URL || "").includes("localhost") ||
      (process.env.PORT || "5000") === "5000" ||
      process.env.NODE_ENV !== "production";

    if (isLocalServer) {
      clientBase = origins.find((o) => o.includes("localhost") || o.includes("127.0.0.1")) || "http://localhost:5173";
    } else {
      clientBase = origins[0] || "http://localhost:5173";
    }
  }

  // Ensure localhost uses http (Vite dev server default)
  if (clientBase.startsWith("https://localhost") || clientBase.startsWith("https://127.0.0.1")) {
    clientBase = clientBase.replace(/^https:/, "http:");
  }
  clientBase = clientBase.replace(/\/+$/, "");

  const rawReturnUrl = parsedState.returnUrl || "/email";
  const targetRedirect = rawReturnUrl.startsWith("/") ? rawReturnUrl : `/${rawReturnUrl}`;
  const separator = targetRedirect.includes("?") ? "&" : "?";

  if (error || !code) {
    const errorMsg = encodeURIComponent(error || "Authorization was denied");
    return res.redirect(`${clientBase}${targetRedirect}${separator}gmail_error=${errorMsg}`);
  }

  const userId = parsedState.userId;

  if (!userId) {
    return res.redirect(
      `${clientBase}${targetRedirect}${separator}gmail_error=${encodeURIComponent(
        "Missing user identification in state"
      )}`
    );
  }

  try {
    const { tokens, profile } = await handleOAuthCallback(code);

    // Encrypt refresh token if present
    const encryptedRefreshToken = tokens.refresh_token ? encryptText(tokens.refresh_token) : undefined;
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

    const updateData = {
      user: userId,
      email: profile.email.toLowerCase(),
      senderName: profile.name || profile.email,
      googleId: profile.sub || profile.id,
      picture: profile.picture,
      accessToken: tokens.access_token,
      tokenExpiry: expiryDate,
      scope: tokens.scope ? tokens.scope.split(" ") : [],
      isConnected: true,
      lastSyncedAt: new Date(),
    };

    if (encryptedRefreshToken) {
      updateData.encryptedRefreshToken = encryptedRefreshToken;
    }

    await EmailAccount.findOneAndUpdate(
      { user: userId, email: profile.email.toLowerCase() },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update user summary settings
    await User.findByIdAndUpdate(userId, {
      "gmailSettings.isConnected": true,
      "gmailSettings.email": profile.email.toLowerCase(),
      "gmailSettings.senderName": profile.name || profile.email,
    });

    return res.redirect(`${clientBase}${targetRedirect}${separator}gmail_connected=true&email=${encodeURIComponent(profile.email)}`);
  } catch (authErr) {
    console.error("Google OAuth callback error:", authErr);
    return res.redirect(`${clientBase}${targetRedirect}${separator}gmail_error=${encodeURIComponent(authErr.message || "Failed to link Gmail account")}`);
  }
});

/**
 * Get user's connected Gmail OAuth account
 * GET /api/email/account
 */
export const getConnectedAccountHandler = asyncHandler(async (req, res) => {
  const account = await EmailAccount.findOne({
    user: req.user._id,
    isConnected: true,
  }).sort({ updatedAt: -1 });

  if (!account) {
    return res.status(200).json({
      success: true,
      connected: false,
      account: null,
    });
  }

  res.status(200).json({
    success: true,
    connected: true,
    account: {
      id: account._id,
      email: account.email,
      senderName: account.senderName,
      picture: account.picture,
      isConnected: account.isConnected,
      lastSyncedAt: account.lastSyncedAt,
      createdAt: account.createdAt,
    },
  });
});

/**
 * Disconnect Gmail account
 * POST /api/email/account/disconnect
 */
export const disconnectAccountHandler = asyncHandler(async (req, res) => {
  await EmailAccount.updateMany(
    { user: req.user._id },
    { $set: { isConnected: false, accessToken: null } }
  );

  await User.findByIdAndUpdate(req.user._id, {
    "gmailSettings.isConnected": false,
    "gmailSettings.email": null,
    "gmailSettings.appPassword": null,
  });

  res.status(200).json({
    success: true,
    message: "Gmail account disconnected successfully",
  });
});

/**
 * Update sender display name
 * PUT /api/email/account/sender-name
 */
export const updateSenderNameHandler = asyncHandler(async (req, res) => {
  const senderName = String(req.body.senderName || "").trim();
  if (!senderName) {
    const error = new Error("Sender name cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  const account = await EmailAccount.findOneAndUpdate(
    { user: req.user._id, isConnected: true },
    { $set: { senderName } },
    { new: true }
  );

  if (!account) {
    const error = new Error("No connected Gmail account found");
    error.statusCode = 404;
    throw error;
  }

  await User.findByIdAndUpdate(req.user._id, {
    "gmailSettings.senderName": senderName,
  });

  res.status(200).json({
    success: true,
    message: "Sender name updated",
    senderName: account.senderName,
  });
});

// Backward-compatibility aliases for legacy routes
export const getGmailSettingsHandler = asyncHandler(async (req, res) => {
  const account = await EmailAccount.findOne({
    user: req.user._id,
    isConnected: true,
  }).sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    gmailSettings: {
      email: account?.email || null,
      senderName: account?.senderName || null,
      isConnected: Boolean(account?.isConnected),
      picture: account?.picture || null,
      lastTestedAt: account?.lastSyncedAt || null,
    },
  });
});

export const updateGmailSettingsHandler = asyncHandler(async (req, res) => {
  const error = new Error("Legacy SMTP/password configuration has been replaced by Gmail OAuth 2.0. Please connect your account with Google.");
  error.statusCode = 400;
  throw error;
});

export const disconnectGmailHandler = disconnectAccountHandler;

