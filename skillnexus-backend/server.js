import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import gigRoutes from "./src/routes/gigRoutes.js";   
import reviewRoutes from "./src/routes/reviewRoutes.js";
import proposalRoutes from "./src/routes/proposalRoutes.js";  

dotenv.config();
connectDB();

const app = express();

app.use(cors());
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
app.use("/api/reviews", reviewRoutes);                
// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SkillNexus Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});