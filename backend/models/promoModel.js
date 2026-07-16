import mongoose from "mongoose";

/**
 * Promo codes managed from the Admin Dashboard (no longer hardcoded).
 * discountPercent is stored 1–100 (admin-friendly); the app converts to a rate.
 */
const promoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const promoModel = mongoose.models.promo || mongoose.model("promo", promoSchema);
export default promoModel;
