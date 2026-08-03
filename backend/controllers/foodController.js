import fs from "fs";
import path from "path";
import foodModel from "../models/foodModel.js";
import { UPLOAD_DIR, storedImageValue } from "../config/upload.js";
import { emitChange } from "../config/io.js";

// Best-effort local file cleanup (skips Cloudinary/remote URLs).
const removeLocalImage = (image) => {
  if (!image || /^https?:\/\//.test(image)) return;
  fs.promises.unlink(path.join(UPLOAD_DIR, image)).catch(() => {});
};

/**
 * Ratings arrive as form-data strings. An empty value clears the rating back to
 * null ("not rated"); anything else must parse to a number in 0–5.
 * Returns { ok, value } so the caller can reject bad input instead of silently
 * coercing "abc" into 0 stars.
 */
const parseRating = (raw) => {
  if (raw === undefined) return { ok: true, value: undefined }; // field not sent
  const text = String(raw).trim();
  if (text === "") return { ok: true, value: null }; // explicitly cleared
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > 5) return { ok: false };
  return { ok: true, value: Math.round(value * 10) / 10 }; // one decimal, e.g. 4.6
};

// GET /api/food/list  — public (storefront): only enabled items
export const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({ disabled: { $ne: true } }).lean();
    res.json({ success: true, data: foods });
  } catch (err) {
    console.error("listFood error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load menu" });
  }
};

// GET /api/admin/food  — admin: ALL items, including disabled ones
export const listAllFood = async (req, res) => {
  try {
    const foods = await foodModel.find({}).sort({ _id: 1 }).lean();
    res.json({ success: true, data: foods });
  } catch (err) {
    console.error("listAllFood error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load menu" });
  }
};

// POST /api/admin/food/toggle  — admin  { id, disabled: boolean }
export const setFoodDisabled = async (req, res) => {
  try {
    const { id, disabled } = req.body;
    const food = await foodModel.findByIdAndUpdate(id, { disabled: !!disabled }, { new: true });
    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found" });
    }
    emitChange("menu:changed");
    res.json({ success: true, data: food });
  } catch (err) {
    console.error("setFoodDisabled error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update item" });
  }
};

// POST /api/food/add  — admin (multipart form-data, field "image")
export const addFood = async (req, res) => {
  try {
    const { name, price, category, description, rating } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "name, price and category are required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "An image is required" });
    }

    const parsedRating = parseRating(rating);
    if (!parsedRating.ok) {
      return res.status(400).json({ success: false, message: "Rating must be a number between 0 and 5" });
    }

    const food = await foodModel.create({
      _id: String(Date.now()),
      name,
      price: Number(price),
      category,
      description: description || "",
      image: storedImageValue(req.file),
      rating: parsedRating.value ?? null,
    });

    emitChange("menu:changed");
    res.status(201).json({ success: true, message: "Food added", data: food });
  } catch (err) {
    console.error("addFood error:", err.message);
    res.status(500).json({ success: false, message: "Failed to add food" });
  }
};

// POST /api/food/edit  — admin (multipart; image optional)  { id, name?, price?, category?, description? }
export const updateFood = async (req, res) => {
  try {
    const { id, name, price, category, description, rating } = req.body;
    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found" });
    }

    const parsedRating = parseRating(rating);
    if (!parsedRating.ok) {
      return res.status(400).json({ success: false, message: "Rating must be a number between 0 and 5" });
    }

    if (name !== undefined) food.name = name;
    if (description !== undefined) food.description = description;
    if (category !== undefined) food.category = category;
    if (price !== undefined && price !== "") food.price = Number(price);
    // undefined = not sent, null = cleared on purpose.
    if (parsedRating.value !== undefined) food.rating = parsedRating.value;

    // If a new image was uploaded, swap it in and best-effort remove the old local file.
    if (req.file) {
      const oldImage = food.image;
      food.image = storedImageValue(req.file);
      removeLocalImage(oldImage);
    }

    await food.save();
    emitChange("menu:changed");
    res.json({ success: true, message: "Food updated", data: food });
  } catch (err) {
    console.error("updateFood error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update food" });
  }
};

// POST /api/food/remove  — admin  { id }
export const removeFood = async (req, res) => {
  try {
    const { id } = req.body;
    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found" });
    }

    // Best-effort cleanup of a local uploaded image (skips remote/Cloudinary URLs).
    removeLocalImage(food.image);

    await foodModel.findByIdAndDelete(id);
    emitChange("menu:changed");
    res.json({ success: true, message: "Food removed" });
  } catch (err) {
    console.error("removeFood error:", err.message);
    res.status(500).json({ success: false, message: "Failed to remove food" });
  }
};
