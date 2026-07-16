/**
 * Promo codes live on the server so discounts can't be forged from the client.
 * Value is the fractional discount applied to the subtotal.
 */
export const PROMO_CODES = {
  JUBAIR15: 0.15,
  SHOSHI15: 0.15,
  BADSHA: 0.75,
};

export const getDiscountRate = (code) => {
  if (!code) return 0;
  return PROMO_CODES[code.trim().toUpperCase()] || 0;
};
