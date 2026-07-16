import promoModel from "../models/promoModel.js";
import { emitChange } from "../config/io.js";

// GET /api/admin/promos  — all promo codes
export const listPromos = async (req, res) => {
  try {
    const promos = await promoModel.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: promos });
  } catch (err) {
    console.error("listPromos error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load promos" });
  }
};

// POST /api/admin/promos  — create or update a code  { code, discountPercent, active? }
export const createPromo = async (req, res) => {
  try {
    const code = (req.body.code || "").trim().toUpperCase();
    const discountPercent = Number(req.body.discountPercent);

    if (!code) return res.status(400).json({ success: false, message: "Code is required" });
    if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      return res.status(400).json({ success: false, message: "Discount must be between 1 and 100%" });
    }

    const update = { code, discountPercent };
    if (req.body.active !== undefined) update.active = !!req.body.active;

    const promo = await promoModel.findOneAndUpdate({ code }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    emitChange("promos:changed");
    res.status(201).json({ success: true, data: promo });
  } catch (err) {
    console.error("createPromo error:", err.message);
    res.status(500).json({ success: false, message: "Failed to save promo" });
  }
};

// POST /api/admin/promos/toggle  — { id, active }
export const togglePromo = async (req, res) => {
  try {
    const promo = await promoModel.findByIdAndUpdate(
      req.body.id,
      { active: !!req.body.active },
      { new: true }
    );
    if (!promo) return res.status(404).json({ success: false, message: "Promo not found" });
    emitChange("promos:changed");
    res.json({ success: true, data: promo });
  } catch (err) {
    console.error("togglePromo error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update promo" });
  }
};

// POST /api/admin/promos/remove  — { id }
export const deletePromo = async (req, res) => {
  try {
    const promo = await promoModel.findByIdAndDelete(req.body.id);
    if (!promo) return res.status(404).json({ success: false, message: "Promo not found" });
    emitChange("promos:changed");
    res.json({ success: true, message: "Promo removed" });
  } catch (err) {
    console.error("deletePromo error:", err.message);
    res.status(500).json({ success: false, message: "Failed to remove promo" });
  }
};
