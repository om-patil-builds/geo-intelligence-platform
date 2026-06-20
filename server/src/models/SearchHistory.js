import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    keyword: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    radius: { type: Number, default: 10000 },
    status: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
    },
    jobId: { type: String, index: true },
    resultsCount: { type: Number, default: 0 },
    newCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ user: 1, createdAt: -1 });
searchHistorySchema.index({ user: 1, jobId: 1 });

export default mongoose.model("SearchHistory", searchHistorySchema);
