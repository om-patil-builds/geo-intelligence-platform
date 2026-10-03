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
  getGmailSettingsHandler,
  updateGmailSettingsHandler,
  disconnectGmailHandler,
} from "../controllers/emailCampaignController.js";

const router = express.Router();

router.use(authMiddleware);

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

// Gmail User Configuration
router.get("/settings/gmail", getGmailSettingsHandler);
router.post("/settings/gmail", updateGmailSettingsHandler);
router.post("/settings/disconnect-gmail", disconnectGmailHandler);

export default router;
