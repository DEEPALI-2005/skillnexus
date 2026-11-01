import Review from "../models/Review.js";
import Gig from "../models/Gig.js";
import User from "../models/User.js";

// ==================== CREATE REVIEW ====================
// POST /api/reviews
// Private route (only client)

export const createReview = async (req, res) => {
  try {
    const { gigId, rating, comment } = req.body;

    if (!gigId || !rating || !comment) {
      return res.status(400).json({ success: false, message: "Please provide gigId, rating and comment" });
    }

    const gig = await Gig.findById(gigId);

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    // 1. Check if gig is completed
    if (gig.status !== "completed") {
      return res.status(400).json({ success: false, message: "You can only review a completed gig" });
    }

    // 2. Check if user is the gig owner
    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the client who posted the gig can leave a review" });
    }

    // 3. Check if freelancer is assigned
    if (!gig.assignedFreelancer) {
      return res.status(400).json({ success: false, message: "No freelancer assigned to this gig" });
    }

    // 4. Check if review already exists (Mongoose unique index will also catch this, but let's give a clean error)
    const existingReview = await Review.findOne({ gig: gigId, reviewer: req.user._id });
    if (existingReview) {
      return res.status(409).json({ success: false, message: "You have already reviewed this gig" });
    }

    // 5. Create Review
    const review = await Review.create({
      gig: gigId,
      reviewer: req.user._id,
      reviewee: gig.assignedFreelancer,
      rating,
      comment,
    });

    // 6. Update Freelancer's Average Rating (The Math part)
    const freelancer = await User.findById(gig.assignedFreelancer);
    
    const newNumReviews = freelancer.numReviews + 1;
    // Formula: ((OldAvg * OldCount) + NewRating) / NewCount
    const newRating = ((freelancer.rating * freelancer.numReviews) + rating) / newNumReviews;

    freelancer.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
    freelancer.numReviews = newNumReviews;
    await freelancer.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already reviewed this gig" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET USER REVIEWS ====================
// GET /api/reviews/user/:userId
// Public route

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "name avatar")
      .populate("gig", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};