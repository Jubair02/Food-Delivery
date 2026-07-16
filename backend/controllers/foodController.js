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
    const { name, price, category, description } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "name, price and category are required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "An image is required" });
    }

    const food = await foodModel.create({
      _id: String(Date.now()),
      name,
      price: Number(price),
      category,
      description: description || "",
      image: storedImageValue(req.file),
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
    const { id, name, price, category, description } = req.body;
    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found" });
    }

    if (name !== undefined) food.name = name;
    if (description !== undefined) food.description = description;
    if (category !== undefined) food.category = category;
    if (price !== undefined && price !== "") food.price = Number(price);

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
