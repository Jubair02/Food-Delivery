import Stripe from "stripe";

let stripe = null;

/**
 * Returns a Stripe client if STRIPE_SECRET_KEY is configured, otherwise null.
 * When null, the order flow falls back to "cash on delivery" so the app still
 * works end-to-end without Stripe credentials.
 */
export const getStripe = () => {
  if (stripe) return stripe;
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return null;
  stripe = new Stripe(key);
  return stripe;
};
