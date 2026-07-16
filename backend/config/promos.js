import promoModel from "../models/promoModel.js";

/**
 * Resolves the fractional discount (e.g. 0.15) for a promo code.
 * Codes are managed from the Admin Dashboard and stored in MongoDB — only
 * active codes apply. Returns 0 for missing/unknown/inactive codes.
 */
export const getDiscountRate = async (code) => {
  if (!code) return 0;
  const promo = await promoModel
    .findOne({ code: code.trim().toUpperCase(), active: true })
    .lean();
  return promo ? promo.discountPercent / 100 : 0;
};
