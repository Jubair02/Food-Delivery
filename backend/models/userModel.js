import mongoose from "mongoose";

/**
 * A saved delivery address. Mirrors the fields the checkout form collects so
 * the profile can pre-fill the order form 1:1.
 */
const addressSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: { type: String, default: "" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zipcode: { type: String, default: "" },
    country: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

/**
 * A user record keyed by the Firebase UID. We never store passwords —
 * Firebase owns authentication. This holds app-side profile data plus a single
 * default delivery address.
 */
const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Firebase UID
    email: { type: String, required: true },
    name: { type: String, default: "" },
    address: { type: addressSchema, default: () => ({}) },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true, _id: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
