import mongoose from "mongoose";

const searchResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    searchHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SearchHistory",
      required: true,
      index: true,
    },
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      required: true,
      index: true,
    },
    googlePlaceId: {
      type: String,
      required: true,
      index: true,
    },
    isNew: {
      type: Boolean,
      default: false,
    },
    duplicate: {
      type: Boolean,
      default: false,
    },
    duplicateReason: {
      type: String,
      enum: ["none", "placeId", "fuzzy"],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

searchResultSchema.index({ user: 1, searchHistory: 1, place: 1 }, { unique: true });
searchResultSchema.index({ user: 1, place: 1 });

export default mongoose.model("SearchResult", searchResultSchema);
