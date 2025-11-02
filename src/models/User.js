import mongoose from "mongoose";
import AddressSchema from "./Address.js";

const UserSchema = new mongoose.Schema(
  {
    // Clerk Core Fields
    clerkId: { type: String, required: true, unique: true },

    // Basic Information
    firstName: String,
    lastName: String,
    username: String,
    email: String,
    imageUrl: String,

    // Application Specific
    role: { type: String, enum: ["user", "admin"], default: "user" },
    address: AddressSchema,

    // Sync Information
    lastSyncedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// Virtual for display name
UserSchema.virtual("displayName").get(function () {
  return (
    `${this.firstName || ""} ${this.lastName || ""}`.trim() ||
    this.username ||
    "Unknown User"
  );
});

export default mongoose.model("User", UserSchema);