import mongoose from "mongoose";

const emailTargetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailCampaign",
      required: true,
      index: true,
    },
    scrapingTarget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScrapingTarget",
      default: null,
      index: true,
    },
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      default: null,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    businessName: {
      type: String,
      default: "",
      trim: true,
    },
    website: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    lastAttemptAt: {
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

// High performance queue polling index
emailTargetSchema.index({ campaign: 1, status: 1, createdAt: 1 });
// Enforce unique recipient per campaign to prevent duplicate emails
emailTargetSchema.index({ campaign: 1, recipientEmail: 1 }, { unique: true });

export default mongoose.model("EmailTarget", emailTargetSchema);
