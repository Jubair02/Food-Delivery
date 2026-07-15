import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

const TOKEN_TTL = "12h";

// POST /api/admin/login  — public  { email, password }
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const admin = await adminModel.findOne({ email: email.toLowerCase().trim() });
    // Compare even when not found is overkill here; a clear generic message is fine.
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, name: admin.name },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: TOKEN_TTL }
    );

    res.json({
      success: true,
      token,
      admin: { email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error("adminLogin error:", err.message);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// GET /api/admin/me  — verify the current admin session
export const adminMe = (req, res) => {
  res.json({ success: true, admin: req.admin });
};

// GET /api/admin/customers  — all customers with order stats
export const getCustomers = async (req, res) => {
  try {
    const [users, stats] = await Promise.all([
      userModel.find({}).sort({ createdAt: -1 }).lean(),
      orderModel.aggregate([
        { $group: { _id: "$userId", orders: { $sum: 1 }, spent: { $sum: "$amount" } } },
      ]),
    ]);

    const statById = new Map(stats.map((s) => [s._id, s]));
    const data = users.map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name,
      phone: u.address?.phone || "",
      city: u.address?.city || "",
      joinedAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      orders: statById.get(u._id)?.orders || 0,
      spent: +(statById.get(u._id)?.spent || 0).toFixed(2),
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("getCustomers error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load customers" });
  }
};

// GET /api/admin/overview  — headline platform stats
export const getOverview = async (req, res) => {
  try {
    const [customers, orderAgg, pending] = await Promise.all([
      userModel.countDocuments({}),
      orderModel.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      ]),
      orderModel.countDocuments({ status: "Pending" }),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        orders: orderAgg[0]?.count || 0,
        revenue: +(orderAgg[0]?.revenue || 0).toFixed(2),
        pending,
      },
    });
  } catch (err) {
    console.error("getOverview error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load overview" });
  }
};
