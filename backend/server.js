import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import { initIO } from "./config/io.js";
import { UPLOAD_DIR } from "./config/upload.js";
import foodRouter from "./routes/foodRoute.js";
import orderRouter from "./routes/orderRoute.js";
import userRouter from "./routes/userRoute.js";
import adminRouter from "./routes/adminRoute.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS — allow the customer app and the (separate) admin app origins.
const allowedOrigins = [
  ...(process.env.CLIENT_URL || "http://localhost:5173").split(","),
  ...(process.env.ADMIN_CLIENT_URL || "http://localhost:5174").split(","),
].map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Serve admin-uploaded food images
app.use("/images", express.static(UPLOAD_DIR));

// Health check
app.get("/", (req, res) => res.send("Food Delivery API is running"));

// Routes
app.use("/api/food", foodRouter);   // public menu
app.use("/api/order", orderRouter); // customer (Firebase auth)
app.use("/api/user", userRouter);   // customer (Firebase auth)
app.use("/api/admin", adminRouter); // admin (JWT auth, separate realm)

// Centralised fallback error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

const start = async () => {
  try {
    initFirebaseAdmin();
    await connectDB();

    const server = http.createServer(app);
    initIO(server, allowedOrigins); // real-time channel for admin dashboards
    server.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();
