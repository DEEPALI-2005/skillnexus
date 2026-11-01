import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "../src/models/Message.js";

dotenv.config();

const clearMessages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    const result = await Message.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} test messages from database.`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

clearMessages();