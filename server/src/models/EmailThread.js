import mongoose from "mongoose";

const emailThreadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    emailAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailAccount",
      required: true,
      index: true,
    },
    gmailThreadId: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      default: "",
    },
    snippet: {
      type: String,
      default: "",
    },
    participants: [
      {
        name: { type: String, default: "" },
        email: { type: String, required: true, lowercase: true, trim: true },
      },
    ],
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    messageCount: {
      type: Number,
      default: 1,
    },
    isUnread: {
      type: Boolean,
      default: false,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    labels: {
      type: [String],
      default: [],
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailCampaign",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

emailThreadSchema.index({ user: 1, emailAccount: 1, gmailThreadId: 1 }, { unique: true });
emailThreadSchema.index({ user: 1, lastMessageAt: -1 });

export default mongoose.model("EmailThread", emailThreadSchema);
