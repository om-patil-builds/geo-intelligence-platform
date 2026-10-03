import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createEmailCampaign,
  listEmailCampaigns,
  getEmailCampaignById,
  updateEmailCampaign,
  deleteEmailCampaignHandler,
  importLeadsHandler,
  getEmailCampaignProgress,
} from "../controllers/emailCampaignController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/campaigns", createEmailCampaign);
router.get("/campaigns", listEmailCampaigns);
router.get("/campaigns/:id", getEmailCampaignById);
router.put("/campaigns/:id", updateEmailCampaign);
router.delete("/campaigns/:id", deleteEmailCampaignHandler);

router.post("/campaigns/:id/import-leads", importLeadsHandler);
router.get("/campaigns/:id/progress", getEmailCampaignProgress);

export default router;
