// src/scripts/createTestUsers.js
// Run: node scripts/createTestUsers.js
// Creates (or updates) a test client and test freelancer, prints their JWT tokens.

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// .env path resolve
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import User from "../src/models/User.js";
import generateToken from "../src/utils/generateToken.js";

const CLIENT = {
  name: "Test Client",
  email: "client@skillnexus.com",
  password: "password123",
  role: "client",
  location: { city: "Mumbai", state: "Maharashtra" },
};

const FREELANCER = {
  name: "Test Freelancer",
  email: "freelancer@skillnexus.com",
  password: "password123",
  role: "freelancer",
  location: { city: "Pune", state: "Maharashtra" },
};

const ensureUser = async (data) => {
  let user = await User.findOne({ email: data.email });

  if (user) {
    console.log(`↺  Exists: ${data.email} (${user.role})`);
    return user;
  }

  user = await User.create(data);
  console.log(`✓ Created: ${data.email} (${user.role})`);
  return user;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected\n");

    const client = await ensureUser(CLIENT);
    const freelancer = await ensureUser(FREELANCER);

    const clientToken = generateToken(client._id, client.role);
    const freelancerToken = generateToken(freelancer._id, freelancer.role);

    console.log("\n============================================");
    console.log("CLIENT");
    console.log("============================================");
    console.log("_id    :", client._id.toString());
    console.log("email  :", client.email);
    console.log("role   :", client.role);
    console.log("token  :", clientToken);

    console.log("\n============================================");
    console.log("FREELANCER");
    console.log("============================================");
    console.log("_id    :", freelancer._id.toString());
    console.log("email  :", freelancer.email);
    console.log("role   :", freelancer.role);
    console.log("token  :", freelancerToken);

    console.log("\nCopy the tokens into Thunder Client.");
    console.log("Header: Authorization: Bearer <token>\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

run();