import mongoose from "mongoose";

const scrapingCampaignSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "running", "paused", "completed", "failed"],
      default: "draft",
      index: true,
    },
    stats: {
      totalWebsites: { type: Number, default: 0 },
      pendingCount: { type: Number, default: 0 },
      processingCount: { type: Number, default: 0 },
      scrapedCount: { type: Number, default: 0 },
      emailsFoundCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
    concurrency: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

scrapingCampaignSchema.index({ user: 1, topic: 1 });
scrapingCampaignSchema.index({ user: 1, status: 1 });

export default mongoose.model("ScrapingCampaign", scrapingCampaignSchema);
