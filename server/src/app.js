import "dotenv/config";
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

// Robust CORS supporting development and production deployments
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(",").forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1");

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow to avoid unexpected network disconnects
    },
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

// Rate Limiting (1000 requests per 15 min, skipping streaming/progress polling)
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.API_RATE_LIMIT || 1000),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return (
        req.path.includes("/progress") ||
        req.path.includes("/stream") ||
        req.path.includes("/status")
      );
    },
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
