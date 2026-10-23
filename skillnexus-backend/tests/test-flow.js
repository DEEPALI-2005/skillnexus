import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Random email generate karo taaki baar baar test karne pe duplicate error na aaye
const timestamp = Date.now();
const clientEmail = `client_${timestamp}@test.com`;
const freelancerEmail = `freelancer_${timestamp}@test.com`;

const log = (msg, data = "") => console.log(`\n👉 ${msg}`, data ? data : "");

const runTest = async () => {
  try {
    console.log("=========================================");
    console.log("🚀 SKILLNEXUS END-TO-END TEST START");
    console.log("=========================================");

    // ==================== 1. REGISTER CLIENT ====================
    log("1. Registering Client...");
    const clientRegRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Client",
      email: clientEmail,
      password: "password123",
      role: "client",
    });
    console.log("✅ Client Registered. ID:", clientRegRes.data.data._id);

    // ==================== 2. REGISTER FREELANCER ====================
    log("2. Registering Freelancer...");
    const freeRegRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Freelancer",
      email: freelancerEmail,
      password: "password123",
      role: "freelancer",
    });
    console.log("✅ Freelancer Registered. ID:", freeRegRes.data.data._id);

    // ==================== 3. LOGIN CLIENT ====================
    log("3. Logging in Client...");
    const clientLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: clientEmail,
      password: "password123",
    });
    const clientToken = clientLoginRes.data.data.token;
    console.log("✅ Client Logged In. Token acquired.");

    // ==================== 4. LOGIN FREELANCER ====================
    log("4. Logging in Freelancer...");
    const freeLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: freelancerEmail,
      password: "password123",
    });
    const freelancerToken = freeLoginRes.data.data.token;
    console.log("✅ Freelancer Logged In. Token acquired.");

    // ==================== 5. CLIENT CREATES GIG ====================
    log("5. Client creating a Gig...");
    const gigRes = await axios.post(
      `${API_URL}/gigs`,
      {
        title: "Build an E-commerce Backend",
        description: "Need an experienced Node.js developer to build APIs and database schema for an e-commerce platform.",
        category: "web-development",
        skillsRequired: ["Node.js", "MongoDB", "Express"],
        budgetType: "fixed",
        budgetMin: 20000,
        budgetMax: 35000,
        deadline: "2026-12-31T23:59:59.000Z",
      },
      {
        headers: { Authorization: `Bearer ${clientToken}` },
      }
    );
    const gigId = gigRes.data.data._id;
    console.log("✅ Gig Created. ID:", gigId);

    // ==================== 6. FREELANCER SUBMITS PROPOSAL ====================
    log("6. Freelancer submitting Proposal...");
    const proposalRes = await axios.post(
      `${API_URL}/gigs/${gigId}/proposals`,
      {
        coverLetter: "I have 5 years of experience building scalable e-commerce backends. I can deliver this within the timeframe.",
        bidAmount: 30000,
        estimatedDays: 20,
      },
      {
        headers: { Authorization: `Bearer ${freelancerToken}` },
      }
    );
    const proposalId = proposalRes.data.data._id;
    console.log("✅ Proposal Submitted. ID:", proposalId);

    // ==================== 7. CLIENT ACCEPTS PROPOSAL ====================
    log("7. Client accepting Proposal...");
    await axios.put(
      `${API_URL}/proposals/${proposalId}/accept`,
      {},
      {
        headers: { Authorization: `Bearer ${clientToken}` },
      }
    );
    console.log("✅ Proposal Accepted.");

    // ==================== 8. VERIFY FINAL STATE ====================
    log("8. Verifying Gig State...");
    const finalGigRes = await axios.get(`${API_URL}/gigs/${gigId}`);
    const finalGig = finalGigRes.data.data;

    if (finalGig.status !== "in-progress") {
      throw new Error("FAILED: Gig status is not 'in-progress'");
    }
    if (!finalGig.assignedFreelancer) {
      throw new Error("FAILED: Gig has no assigned freelancer");
    }
    
    console.log("✅ Gig Status:", finalGig.status);
    console.log("✅ Assigned Freelancer:", finalGig.assignedFreelancer.name);

    console.log("\n=========================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Message:", error.response.data.message);
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
};

runTest();