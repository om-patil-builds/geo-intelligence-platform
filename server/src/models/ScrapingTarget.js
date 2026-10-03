import mongoose from "mongoose";

const emailRecordSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    sourcePage: {
      type: String,
      trim: true,
      default: "",
    },
    discoveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const scrapingTargetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScrapingCampaign",
      required: true,
      index: true,
    },
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      default: null,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    websiteUrl: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "scraped", "failed", "skipped"],
      default: "pending",
      index: true,
    },
    emails: {
      type: [emailRecordSchema],
      default: [],
    },
    pagesScanned: {
      type: [String],
      default: [],
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance queue polling index
scrapingTargetSchema.index({ campaign: 1, status: 1, createdAt: 1 });
// Avoid duplicate domain scraping within the same campaign
scrapingTargetSchema.index({ campaign: 1, normalizedDomain: 1 }, { unique: true });

export default mongoose.model("ScrapingTarget", scrapingTargetSchema);
