import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    gmailSettings: {
      email: { type: String, trim: true, lowercase: true, default: null },
      appPassword: { type: String, default: null },
      senderName: { type: String, trim: true, default: null },
      isConnected: { type: Boolean, default: false },
      lastTestedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
