import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import messageRoutes from "./src/routes/messageRoutes.js";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import gigRoutes from "./src/routes/gigRoutes.js";
import proposalRoutes from "./src/routes/proposalRoutes.js";
import Message from "./src/models/Message.js";

dotenv.config();
connectDB();

const app = express();

// ==================== MIDDLEWARES ====================
app.use(cors({
  origin: "*",   // Abhi ke liye allow all. Production mein frontend URL daalenge
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SkillNexus API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/messages", messageRoutes);
// ==================== HTTP SERVER ====================
// Socket.IO ko Express app nahi, HTTP server chahiye
const httpServer = createServer(app);

// ==================== SOCKET.IO SETUP ====================
const io = new Server(httpServer, {
  cors: {
    origin: "*",   // Production mein frontend URL daalna
    methods: ["GET", "POST"],
  },
});

// ==================== ONLINE USERS TRACKER ====================
// userId -> socket.id mapping
// Ek user ke multiple tabs ho sakte hain, isliye Set of socket IDs
const onlineUsers = new Map();

// ==================== SOCKET AUTH MIDDLEWARE ====================
// Har naya socket connect hone pe JWT verify karega

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;

    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// ==================== SOCKET CONNECTION HANDLER ====================
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId} (Socket: ${socket.id})`);

  // ==================== ONLINE USERS TRACKER UPDATE ====================
  if (!onlineUsers.has(socket.userId)) {
    onlineUsers.set(socket.userId, new Set());
  }
  onlineUsers.get(socket.userId).add(socket.id);

  // Sabko batao ki ye user online aa gaya
  io.emit("user:online", { userId: socket.userId });

  // ==================== SEND MESSAGE ====================
  socket.on("message:send", async (data, callback) => {
    try {
      const { receiverId, content, gigId } = data;

      if (!receiverId || !content) {
        return callback({ success: false, message: "receiverId and content required" });
      }

      // Database mein save karo
      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content,
        gig: gigId || null,
        messageType: "text",
      });

      // Populate sender info
      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name avatar")
        .populate("receiver", "name avatar");

      // Sender ko confirm karo (via callback)
      callback({ success: true, message: populatedMessage });

      // Receiver ko message bhejo
      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit("message:received", populatedMessage);
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
      callback({ success: false, message: "Failed to send message" });
    }
  });

  // ==================== TYPING INDICATOR ====================
  socket.on("typing:start", ({ receiverId }) => {
    const receiverSockets = onlineUsers.get(receiverId);
    if (receiverSockets) {
      receiverSockets.forEach((socketId) => {
        io.to(socketId).emit("typing:started", { userId: socket.userId });
      });
    }
  });

  socket.on("typing:stop", ({ receiverId }) => {
    const receiverSockets = onlineUsers.get(receiverId);
    if (receiverSockets) {
      receiverSockets.forEach((socketId) => {
        io.to(socketId).emit("typing:stopped", { userId: socket.userId });
      });
    }
  });

  // ==================== MARK AS READ ====================
  socket.on("message:mark-read", async ({ senderId }) => {
    try {
      await Message.updateMany(
        { sender: senderId, receiver: socket.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      // Sender ko notify karo ki uska message read ho gaya
      const senderSockets = onlineUsers.get(senderId);
      if (senderSockets) {
        senderSockets.forEach((socketId) => {
          io.to(socketId).emit("messages:read", { byUserId: socket.userId });
        });
      }
    } catch (error) {
      console.error("Mark read error:", error);
    }
  });

  // ==================== DISCONNECT ====================
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId} (Socket: ${socket.id})`);

    // Tracker update
    if (onlineUsers.has(socket.userId)) {
      const sockets = onlineUsers.get(socket.userId);
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(socket.userId);
        // Sabko batao ki ye user offline ho gaya
        io.emit("user:offline", { userId: socket.userId });
      }
    }
  });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`SkillNexus Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready for connections`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});