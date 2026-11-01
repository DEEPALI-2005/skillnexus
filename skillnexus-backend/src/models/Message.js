import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // ==================== CONVERSATION ====================
    // Ek conversation = 2 users ke beech
    // conversationId = sorted combination of 2 user IDs

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional: kis gig ke baare mein baat ho rahi hai
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      default: null,
    },

    // ==================== MESSAGE CONTENT ====================
    content: {
      type: String,
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },

    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    // ==================== STATUS ====================
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
// Conversation fetch karna fast ho
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });   // unread count ke liye

const Message = mongoose.model("Message", messageSchema);

export default Message;