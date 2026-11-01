import express from "express";
import {
  getConversation,
  getConversationsList,
  markConversationAsRead,
  deleteMessage,
} from "../controllers/messageController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==================== MESSAGE ROUTES ====================

// List all conversations (dashboard)
router.get("/conversations", protect, getConversationsList);

// Mark all messages from a user as read
router.put("/read/:senderId", protect, markConversationAsRead);

// Get chat history with a specific user
router.get("/:userId", protect, getConversation);

// Delete a message (soft delete)
router.delete("/:id", protect, deleteMessage);

export default router;