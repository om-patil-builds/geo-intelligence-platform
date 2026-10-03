import express from "express";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  refreshTokenUser,
  logoutUser,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authRateLimiter from "../middleware/authRateLimiter.js";

const router = express.Router();

router.post("/register", authRateLimiter, registerUser);
router.post("/login", authRateLimiter, loginUser);
router.post("/refresh", refreshTokenUser);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
