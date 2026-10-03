import mongoose from "mongoose";

const emailMessageSchema = new mongoose.Schema(
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
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailThread",
      default: null,
      index: true,
    },
    gmailMessageId: {
      type: String,
      required: true,
      index: true,
    },
    gmailThreadId: {
      type: String,
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
      index: true,
    },
    from: {
      name: { type: String, default: "" },
      email: { type: String, required: true, lowercase: true, trim: true },
    },
    to: [
      {
        name: { type: String, default: "" },
        email: { type: String, required: true, lowercase: true, trim: true },
      },
    ],
    subject: {
      type: String,
      default: "",
    },
    snippet: {
      type: String,
      default: "",
    },
    bodyHtml: {
      type: String,
      default: "",
    },
    bodyText: {
      type: String,
      default: "",
    },
    inReplyTo: {
      type: String,
      default: null,
    },
    references: {
      type: [String],
      default: [],
    },
    labels: {
      type: [String],
      default: [],
    },
    sentAt: {
      type: Date,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailCampaign",
      default: null,
      index: true,
    },
    campaignTarget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTarget",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

emailMessageSchema.index({ user: 1, emailAccount: 1, gmailMessageId: 1 }, { unique: true });
emailMessageSchema.index({ user: 1, gmailThreadId: 1 });

export default mongoose.model("EmailMessage", emailMessageSchema);
