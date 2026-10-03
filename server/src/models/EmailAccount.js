import mongoose from "mongoose";

const emailAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      default: "google",
      enum: ["google"],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    senderName: {
      type: String,
      trim: true,
      default: "",
    },
    picture: {
      type: String,
      default: null,
    },
    // Encrypted OAuth tokens (select: false so never leaked in accidental queries)
    encryptedRefreshToken: {
      type: String,
      required: true,
      select: false,
    },
    accessToken: {
      type: String,
      default: null,
      select: false,
    },
    tokenExpiry: {
      type: Date,
      default: null,
    },
    scope: {
      type: [String],
      default: [],
    },
    isConnected: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastError: {
      type: String,
      default: null,
    },
    // Future Gmail Inbox Architecture fields (sync, watch, history)
    historyId: {
      type: String,
      default: null,
    },
    watchExpiration: {
      type: Date,
      default: null,
    },
    syncStatus: {
      type: String,
      enum: ["idle", "syncing", "synced", "failed"],
      default: "idle",
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emailAccountSchema.index({ user: 1, email: 1 }, { unique: true });
emailAccountSchema.index({ user: 1, isConnected: 1 });

export default mongoose.model("EmailAccount", emailAccountSchema);
