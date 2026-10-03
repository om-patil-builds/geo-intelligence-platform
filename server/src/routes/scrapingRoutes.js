import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createCampaign,
  listCampaigns,
  getCampaignById,
  deleteCampaignHandler,
  addPlacesToCampaign,
  startCampaignHandler,
  pauseCampaignHandler,
  resumeCampaignHandler,
  getCampaignProgress,
  streamCampaignProgress,
} from "../controllers/scrapingController.js";

const router = express.Router();

// Require authentication for all scraping endpoints
router.use(authMiddleware);

router.post("/campaigns", createCampaign);
router.get("/campaigns", listCampaigns);
router.get("/campaigns/:id", getCampaignById);
router.delete("/campaigns/:id", deleteCampaignHandler);

router.post("/campaigns/:id/add-places", addPlacesToCampaign);
router.post("/campaigns/:id/start", startCampaignHandler);
router.post("/campaigns/:id/pause", pauseCampaignHandler);
router.post("/campaigns/:id/resume", resumeCampaignHandler);

router.get("/campaigns/:id/progress", getCampaignProgress);
router.get("/campaigns/:id/stream", streamCampaignProgress);

export default router;
