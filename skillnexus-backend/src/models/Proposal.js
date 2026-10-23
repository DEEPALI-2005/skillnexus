import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
      index: true,
    },

    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==================== PROPOSAL CONTENT ====================
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
      trim: true,
      minlength: [50, "Cover letter must be at least 50 characters"],
      maxlength: [2000, "Cover letter cannot exceed 2000 characters"],
    },

    bidAmount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [0, "Bid amount cannot be negative"],
    },

    estimatedDays: {
      type: Number,
      required: [true, "Estimated days is required"],
      min: [1, "Estimated days must be at least 1"],
      max: [365, "Estimated days cannot exceed 365"],
    },

    // ==================== ATTACHMENTS ====================
    attachments: {
      type: [String],   // Cloudinary URLs (baad mein)
      default: [],
    },

    // ==================== STATUS ====================
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },

    // ==================== CLIENT RESPONSE ====================
    clientResponse: {
      type: String,
      trim: true,
      default: "",
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== UNIQUE INDEX ====================
// Ek freelancer ek gig pe sirf ek proposal bhej sakta hai

proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

// ==================== OTHER INDEXES ====================
proposalSchema.index({ status: 1 });
proposalSchema.index({ createdAt: -1 });

const Proposal = mongoose.model("Proposal", proposalSchema);

export default Proposal;