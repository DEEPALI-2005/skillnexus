import { io } from "socket.io-client";
import axios from "axios";

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const runChatTest = async () => {
  try {
    console.log("🚀 STARTING CHAT TEST...");

    const clientEmail = "dipali.test@skillnexus.com"; // Replace with real test email
    const freelancerEmail = "dipali.freelancer@skillnexus.com"; // Replace with real test email
    const password = "password123";

    const clientRes = await axios.post(`${API_URL}/auth/login`, { email: clientEmail, password });
    const freelancerRes = await axios.post(`${API_URL}/auth/login`, { email: freelancerEmail, password });

    const clientToken = clientRes.data.data.token;
    const freelancerToken = freelancerRes.data.data.token;
    const clientId = clientRes.data.data._id;
    const freelancerId = freelancerRes.data.data._id;

    console.log("✅ Logged in both users");

    const clientSocket = io(SOCKET_URL, { auth: { token: clientToken } });
    const freelancerSocket = io(SOCKET_URL, { auth: { token: freelancerToken } });

    clientSocket.on("connect", () => console.log("✅ Client socket connected"));
    freelancerSocket.on("connect", () => console.log("✅ Freelancer socket connected"));

    let messageCount = 0;

    // 1. Client receives message (ONLY listen, no reply logic inside)
    clientSocket.on("message:received", (msg) => {
      console.log("📩 Client received:", msg.content);
      messageCount++;
      
      if (messageCount === 1) {
        // Test complete hone par cleanup
        console.log("🎉 TEST COMPLETED SUCCESSFULLY!");
        setTimeout(() => {
          clientSocket.disconnect();
          freelancerSocket.disconnect();
          process.exit(0);
        }, 1000);
      }
    });

    // 2. Freelancer receives message and replies ONCE
    freelancerSocket.on("message:received", async (msg) => {
      console.log("📩 Freelancer received:", msg.content);
      
      // Reply only once
      clientSocket.emit("message:send", {
        receiverId: freelancerId,
        content: "Yes, I can start immediately.",
      }, (res) => {
        if (res.success) console.log("✅ Freelancer sent reply");
      });
      
      // Mark as read
      await axios.put(`${API_URL}/messages/read/${clientId}`, {}, {
        headers: { Authorization: `Bearer ${freelancerToken}` }
      });
      console.log("✅ Freelancer marked messages as read");
    });

    // 3. Client initiates chat after 2 seconds
    setTimeout(() => {
      clientSocket.emit("message:send", {
        receiverId: freelancerId,
        content: "Hi! Are you available for the e-commerce project?",
      }, (res) => {
        if (res.success) console.log("✅ Client sent initial message");
      });
    }, 2000);

  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
};

runChatTest();