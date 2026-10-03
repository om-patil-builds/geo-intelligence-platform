import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import placeRoutes from "./routes/placeRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import scrapingRoutes from "./routes/scrapingRoutes.js";
import emailCampaignRoutes from "./routes/emailCampaignRoutes.js";

import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";

const app = express();

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Geo Intelligence Platform API is running",
  });
});

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Logger
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Rate Limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.API_RATE_LIMIT || 100),
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "geo-intelligence-api",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/scraping", scrapingRoutes);
app.use("/api/email", emailCampaignRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
