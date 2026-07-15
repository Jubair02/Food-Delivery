/**
 * Create (or update the password of) an admin account.
 * Admins can ONLY be created this way — never through the public app.
 *
 * Usage:
 *   node scripts/createAdmin.js <email> <password> ["Full Name"]
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import adminModel from "../models/adminModel.js";

const run = async () => {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: node scripts/createAdmin.js <email> <password> ["Full Name"]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  try {
    await connectDB();
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await adminModel.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { email: email.toLowerCase().trim(), passwordHash, ...(name ? { name } : {}) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Admin ready: ${admin.email} (${admin.name})`);
  } catch (err) {
    console.error("Failed to create admin:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
