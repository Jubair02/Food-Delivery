import mongoose from "mongoose";

/**
 * The _id is kept as a String so it matches the existing frontend ids ("1".."32")
 * and the images bundled in the frontend can be resolved by the same id.
 */
const foodSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    image: { type: String, required: true }, // filename, e.g. "food_1.png"
    disabled: { type: Boolean, default: false }, // hidden from the storefront when true
  },
  { timestamps: true, _id: false }
);

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);
export default foodModel;
