import foodModel from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { getDiscountRate } from "../config/promos.js";
import { getStripe } from "../config/stripe.js";
import { emitChange, emitToUser } from "../config/io.js";

const DELIVERY_FEE = Number(process.env.DELIVERY_FEE ?? 2);
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

/**
 * POST /api/order/place  — auth required
 * Body: { items: { [foodId]: quantity }, address: {...}, promoCode?: string,
 *         paymentMethod?: "online" | "cod" }
 *
 * Prices, discount and total are ALL computed server-side from the DB.
 * Anything money-related sent by the client is ignored on purpose.
 */
export const placeOrder = async (req, res) => {
  try {
    const { items, address, promoCode, paymentMethod } = req.body;

    if (!items || typeof items !== "object" || Object.keys(items).length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (!address || !address.email || !address.street) {
      return res.status(400).json({ success: false, message: "Delivery address is incomplete" });
    }

    // Resolve authoritative prices from the DB for the requested ids.
    const ids = Object.keys(items);
    const foods = await foodModel.find({ _id: { $in: ids } }).lean();
    const foodById = new Map(foods.map((f) => [f._id, f]));

    const orderItems = [];
    let subtotal = 0;

    for (const id of ids) {
      const qty = Number(items[id]);
      const food = foodById.get(id);
      if (!food) {
        return res.status(400).json({ success: false, message: `Unknown item: ${id}` });
      }
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${food.name}` });
      }
      subtotal += food.price * qty;
      orderItems.push({ foodId: id, name: food.name, price: food.price, quantity: qty });
    }

    const discountRate = getDiscountRate(promoCode);
    const discount = +(subtotal * discountRate).toFixed(2);
    const deliveryFee = subtotal === 0 ? 0 : DELIVERY_FEE;
    const amount = +(subtotal - discount + deliveryFee).toFixed(2);

    const stripe = getStripe();
    // Use COD when the customer chose it, or when Stripe isn't configured.
    const useCod = paymentMethod === "cod" || !stripe;

    const order = await orderModel.create({
      userId: req.user.uid,
      items: orderItems,
      address,
      subtotal: +subtotal.toFixed(2),
      discount,
      deliveryFee,
      amount,
      paymentMethod: useCod ? "COD" : "Online",
    });

    // Remember this address on the customer's profile for next time
    // (fire-and-forget — must never block or fail the order).
    userModel.findByIdAndUpdate(req.user.uid, { $set: { address } }).catch(() => {});

    // Push real-time updates to admin dashboards.
    emitChange("orders:changed");
    emitChange("customers:changed");

    // ── Cash on delivery → place the order directly ──────
    if (useCod) {
      order.payment = false;
      await order.save();
      return res.status(201).json({
        success: true,
        message: "Order placed (cash on delivery)",
        codFallback: true,
        orderId: order._id,
      });
    }

    // ── Stripe Checkout session ──────────────────────────
    const line_items = orderItems.map((it) => ({
      price_data: {
        currency: "usd",
        product_data: { name: it.name },
        unit_amount: Math.round(it.price * 100),
      },
      quantity: it.quantity,
    }));
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Fee" },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });

    // Apply the promo discount as a fixed amount_off coupon so the Stripe
    // total matches the server-computed total exactly.
    const discounts = [];
    if (discount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: "usd",
        duration: "once",
        name: "Promo discount",
      });
      discounts.push({ coupon: coupon.id });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      discounts,
      success_url: `${CLIENT_URL}/verify?success=true&orderId=${order._id}`,
      cancel_url: `${CLIENT_URL}/verify?success=false&orderId=${order._id}`,
    });

    res.status(201).json({ success: true, session_url: session.url });
  } catch (err) {
    console.error("placeOrder error:", err.message);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// POST /api/order/verify  — auth  { orderId, success }
// Called after returning from Stripe: confirm payment or discard the order.
export const verifyOrder = async (req, res) => {
  try {
    const { orderId, success } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order || order.userId !== req.user.uid) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (success === true || success === "true") {
      order.payment = true;
      await order.save();
      return res.json({ success: true, message: "Payment confirmed" });
    }

    // Payment cancelled → remove the unpaid order.
    await orderModel.findByIdAndDelete(orderId);
    res.json({ success: false, message: "Payment cancelled" });
  } catch (err) {
    console.error("verifyOrder error:", err.message);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

// GET /api/order/myorders  — auth required
export const myOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.user.uid }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("myOrders error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
};

// GET /api/order/list  — admin: every order, newest first
export const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error("listOrders error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
};

const STATUSES = ["Pending", "Preparing", "Out for delivery", "Delivered", "Cancelled"];

// POST /api/order/status  — admin  { orderId, status }
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const order = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    emitChange("orders:changed"); // admin dashboards
    emitToUser(order.userId, "order:status", { orderId: String(order._id), status: order.status });
    res.json({ success: true, message: "Status updated", data: order });
  } catch (err) {
    console.error("updateStatus error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};
