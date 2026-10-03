import mongoose from "mongoose";

const emailCampaignSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    templateBody: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "sending", "paused", "completed", "failed"],
      default: "draft",
      index: true,
    },
    stats: {
      totalEmails: { type: Number, default: 0 },
      pendingCount: { type: Number, default: 0 },
      sendingCount: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
    sendDelaySeconds: {
      type: Number,
      default: 3, // Safe throttle between Gmail dispatches (default 3s)
      min: 1,
      max: 60,
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

emailCampaignSchema.index({ user: 1, category: 1 });
emailCampaignSchema.index({ user: 1, status: 1 });

export default mongoose.model("EmailCampaign", emailCampaignSchema);
