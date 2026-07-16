import express from "express";
import { placeOrder, verifyOrder, myOrders, checkPromo } from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";

const orderRouter = express.Router();

// Public: validate a promo code (used by the cart to preview the discount).
orderRouter.post("/promo", checkPromo);

// Customer routes (Firebase auth). Admin order management lives under /api/admin.
orderRouter.post("/place", requireAuth, placeOrder);
orderRouter.post("/verify", requireAuth, verifyOrder);
orderRouter.get("/myorders", requireAuth, myOrders);

export default orderRouter;
