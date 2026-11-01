import Message from "../models/Message.js";
import mongoose from "mongoose";

// ==================== 1. GET CONVERSATIONS LIST ====================
// GET /api/messages/conversations
// Dashboard ke liye: Recent chats ki list

export const getConversationsList = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // MongoDB Aggregation: Ek user ki saari chats nikaalo, unique users ke saath
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          isDeleted: false,
        },
      },
      // Sort by newest first taaki latest message sabse upar aaye
      { $sort: { createdAt: -1 } },
      {
        // Group by the "other" user (sender if I'm receiver, receiver if I'm sender)
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$isRead", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      // Doosre user ki details fetch karo (populate equivalent)
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      // Sirf zaroori fields return karo
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          "user._id": 1,
          "user.name": 1,
          "user.avatar": 1,
          "user.role": 1,
        },
      },
      { $limit: 50 }, // Top 50 recent chats
    ]);

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== 2. MARK CONVERSATION AS READ ====================
// PUT /api/messages/read/:senderId
// Jab user chat khole, toh saare messages read mark ho jayein

export const markConversationAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;
    const userId = req.user._id;

    const result = await Message.updateMany(
      { sender: senderId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`,
    });
  } catch (error) {
    console.error("Mark read error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== 3. DELETE MESSAGE (SOFT DELETE) ====================
// DELETE /api/messages/:id
// Message ko permanently delete nahi karte, bas isDeleted: true kar dete hain

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Ownership check: Sirf sender apna message delete kar sakta hai
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    // Soft delete
    message.isDeleted = true;
    message.content = "This message was deleted"; // Optional: content clear kar do
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ==================== GET CONVERSATION (CHAT HISTORY) ====================
// GET /api/messages/:userId
// Ek specific user ke saath chat history fetch karna

export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
      isDeleted: false,
    })
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse(),   // oldest first
    });
  } catch (error) {
    console.error("Get conversation error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};