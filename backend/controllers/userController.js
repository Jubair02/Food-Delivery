import userModel from "../models/userModel.js";
import { emitChange } from "../config/io.js";

const ADDRESS_FIELDS = [
  "firstName", "lastName", "email", "street",
  "city", "state", "zipcode", "country", "phone",
];

// GET /api/user/me  — auth required
// The auth middleware has already upserted the profile; just return it.
export const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.uid).lean();
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("getMe error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
};

// PUT /api/user/me  — auth required  { name?, address? }
// Updates the customer's display name and single default delivery address.
export const updateMe = async (req, res) => {
  try {
    const { name, address } = req.body;
    const update = {};

    if (typeof name === "string") update.name = name.trim();

    if (address && typeof address === "object") {
      const clean = {};
      for (const field of ADDRESS_FIELDS) {
        if (typeof address[field] === "string") clean[field] = address[field].trim();
      }
      update.address = clean;
    }

    const user = await userModel
      .findByIdAndUpdate(req.user.uid, { $set: update }, { new: true, upsert: true })
      .lean();

    emitChange("customers:changed");
    res.json({ success: true, message: "Profile updated", data: user });
  } catch (err) {
    console.error("updateMe error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
