import mongoose from "mongoose";

/**
 * Admin accounts live in their OWN collection, completely separate from the
 * Firebase-authenticated customers. Passwords are bcrypt-hashed. Admins can
 * only be created by the createAdmin CLI script — never through the public app.
 */
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

const adminModel = mongoose.models.admin || mongoose.model("admin", adminSchema);
export default adminModel;
