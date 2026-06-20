import express from "express";
import {
  deletePlace,
  getPlaceById,
  getPlaces,
  getSearchStatus,
  searchPlaces,
} from "../controllers/placeController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/search", searchPlaces);
router.get("/status/:jobId", getSearchStatus);
router.get("/", getPlaces);
router.get("/:id", getPlaceById);
router.delete("/:id", deletePlace);

export default router;
