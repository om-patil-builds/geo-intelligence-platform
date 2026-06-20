import express from "express";
import { exportCsv, exportExcel } from "../controllers/exportController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/csv", exportCsv);
router.get("/excel", exportExcel);

export default router;
