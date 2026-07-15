import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import foodModel from "../models/foodModel.js";
import { foods } from "../data/foods.js";

const run = async () => {
  try {
    await connectDB();
    await foodModel.deleteMany({});
    await foodModel.insertMany(foods);
    console.log(`✅ Seeded ${foods.length} food items`);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
