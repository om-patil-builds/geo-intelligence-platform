import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createEmailCampaign,
  listEmailCampaigns,
  getEmailCampaignById,
  updateEmailCampaign,
  deleteEmailCampaignHandler,
  importLeadsHandler,
  startEmailCampaignHandler,
  pauseEmailCampaignHandler,
  resumeEmailCampaignHandler,
  getEmailCampaignProgress,
  streamEmailCampaignProgress,
  getGoogleAuthUrlHandler,
  handleGoogleAuthCallback,
  getConnectedAccountHandler,
  disconnectAccountHandler,
  updateSenderNameHandler,
  getGmailSettingsHandler,
  updateGmailSettingsHandler,
  disconnectGmailHandler,
} from "../controllers/emailCampaignController.js";

const router = express.Router();

// Public OAuth callback from Google consent redirect (identified via signed state token)
router.get("/oauth/google/callback", handleGoogleAuthCallback);

// All subsequent routes require JWT authentication
router.use(authMiddleware);

// Google OAuth & Account Management
router.get("/oauth/google/url", getGoogleAuthUrlHandler);
router.get("/account", getConnectedAccountHandler);
router.post("/account/disconnect", disconnectAccountHandler);
router.put("/account/sender-name", updateSenderNameHandler);

// Campaign CRUD
router.post("/campaigns", createEmailCampaign);
router.get("/campaigns", listEmailCampaigns);
router.get("/campaigns/:id", getEmailCampaignById);
router.put("/campaigns/:id", updateEmailCampaign);
router.delete("/campaigns/:id", deleteEmailCampaignHandler);

// Leads & Queue controls
router.post("/campaigns/:id/import-leads", importLeadsHandler);
router.post("/campaigns/:id/start", startEmailCampaignHandler);
router.post("/campaigns/:id/pause", pauseEmailCampaignHandler);
router.post("/campaigns/:id/resume", resumeEmailCampaignHandler);

// Progress monitoring
router.get("/campaigns/:id/progress", getEmailCampaignProgress);
router.get("/campaigns/:id/stream", streamEmailCampaignProgress);

// Backward-compatibility aliases for legacy routes
router.get("/settings/gmail", getGmailSettingsHandler);
router.post("/settings/gmail", updateGmailSettingsHandler);
router.post("/settings/disconnect-gmail", disconnectGmailHandler);

export default router;

