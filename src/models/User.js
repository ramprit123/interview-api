import mongoose from "mongoose";
import AddressSchema from "./Address.js";

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    profileImage: String,
    address: AddressSchema,
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
