import express from "express";
import { getHistory, getHistoryResults } from "../controllers/historyController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getHistory);
router.get("/:id/results", getHistoryResults);

export default router;
