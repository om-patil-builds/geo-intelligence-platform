import mongoose from "mongoose";

const placeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    placeId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: null },
    address: { type: String, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    phone: { type: String, default: null },
    website: { type: String, default: null },
    rating: { type: Number, default: null },
    reviewCount: { type: Number, default: 0 },
    openingHours: { type: [String], default: [] },
    searchKeyword: { type: String, default: null },
    searchLocation: { type: String, default: null },
    leadScore: { type: Number, min: 0, max: 100, default: 0 },
    leadTier: { type: String, enum: ["hot", "warm", "cold"], default: "cold" },
    rawTypes: { type: [String], default: [] },
    source: { type: String, default: "google_places" },
  },
  {
    timestamps: true,
  }
);

placeSchema.index({ user: 1, placeId: 1 }, { unique: true });
placeSchema.index({ user: 1, lat: 1, lng: 1 });
placeSchema.index({ user: 1, searchKeyword: 1, searchLocation: 1 });
placeSchema.index({ user: 1, leadTier: 1 });

export default mongoose.model("Place", placeSchema);
