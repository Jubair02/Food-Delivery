/**
 * Promo codes live on the server so discounts can't be forged from the client.
 * Value is the fractional discount applied to the subtotal.
 */
export const PROMO_CODES = {
  JUBAIR15: 0.15,
};

export const getDiscountRate = (code) => {
  if (!code) return 0;
  return PROMO_CODES[code.trim().toUpperCase()] || 0;
};
