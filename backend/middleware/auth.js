import { admin } from "../config/firebaseAdmin.js";
import userModel from "../models/userModel.js";

/**
 * Verifies the Firebase ID token sent as `Authorization: Bearer <token>`.
 * On success attaches { uid, email, name } to req.user and upserts the
 * user's profile so the DB always has a record for authenticated callers.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
    };

    // Keep a lightweight profile in sync on every authenticated request.
    // Email/last-login update each time; name is only set on first creation so
    // it never clobbers a name the user later edits on their profile.
    const setOnInsert = {};
    if (req.user.name) setOnInsert.name = req.user.name;
    const update = { $set: { email: req.user.email, lastLoginAt: new Date() } };
    if (Object.keys(setOnInsert).length) update.$setOnInsert = setOnInsert;

    await userModel.findByIdAndUpdate(decoded.uid, update, {
      upsert: true,
      setDefaultsOnInsert: true,
    });

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
