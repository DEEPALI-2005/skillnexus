import express from "express";
import { createReview, getUserReviews } from "../controllers/reviewController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public: Kisi bhi user ki reviews dekhna
router.get("/user/:userId", getUserReviews);

// Private: Review create karna (sirf client)
router.post("/", protect, authorizeRoles("client"), createReview);

export default router;