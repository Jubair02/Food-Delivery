import jwt from "jsonwebtoken";

/**
 * Verifies the admin JWT sent as `Authorization: Bearer <token>`.
 * This is a completely separate realm from the customer (Firebase) auth —
 * a customer's Firebase token will never validate here, and vice versa.
 */
export const requireAdminAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Admin login required" });
    }
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    req.admin = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired admin session" });
  }
};
