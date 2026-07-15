import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { admin } from "./firebaseAdmin.js";

let io = null;

/**
 * Initialise Socket.IO. Two kinds of clients may connect:
 *   • Admins   — handshake auth: { token }         (admin JWT)  → global events
 *   • Customers — handshake auth: { firebaseToken } (Firebase)  → only their own room
 */
export const initIO = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use(async (socket, next) => {
    const { token, firebaseToken } = socket.handshake.auth || {};

    // Admin JWT — must be valid (admin dashboards rely on it).
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        socket.data.role = "admin";
        socket.data.email = decoded.email;
        return next();
      } catch {
        return next(new Error("Unauthorized"));
      }
    }

    // Logged-in customer — verify Firebase token; if it's bad, fall back to guest.
    if (firebaseToken) {
      try {
        const decoded = await admin.auth().verifyIdToken(firebaseToken);
        socket.data.role = "customer";
        socket.data.uid = decoded.uid;
        return next();
      } catch {
        socket.data.role = "guest";
        return next();
      }
    }

    // Anonymous storefront visitor — receives public broadcasts (e.g. menu:changed)
    // only. No private room, no sensitive payloads are ever emitted globally.
    socket.data.role = "guest";
    next();
  });

  io.on("connection", (socket) => {
    // Customers only ever receive events addressed to their own room.
    if (socket.data.role === "customer") {
      socket.join(`user:${socket.data.uid}`);
    }
    socket.on("disconnect", () => {});
  });

  return io;
};

/** Broadcast to every connected admin dashboard. */
export const emitChange = (event, payload) => {
  if (io) io.emit(event, payload ?? {});
};

/** Send an event to a single customer (their private room). */
export const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload ?? {});
};
