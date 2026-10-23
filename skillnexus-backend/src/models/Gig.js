import mongoose from "mongoose";

const gigSchema = new mongoose.Schema(
  {
    // ==================== BASIC INFO ====================
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [30, "Description must be at least 30 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "web-development",
        "mobile-development",
        "ui-ux-design",
        "content-writing",
        "graphic-design",
        "digital-marketing",
        "data-science",
        "other",
      ],
    },

    skillsRequired: {
      type: [String],
      required: [true, "At least one skill is required"],
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: "At least one skill is required",
      },
    },

    // ==================== BUDGET ====================
    budgetType: {
      type: String,
      enum: ["fixed", "hourly"],
      default: "fixed",
    },

    budgetMin: {
      type: Number,
      required: [true, "Minimum budget is required"],
      min: [0, "Budget cannot be negative"],
    },

    budgetMax: {
      type: Number,
      required: [true, "Maximum budget is required"],
      min: [0, "Budget cannot be negative"],
      validate: {
        validator: function (value) {
          return value >= this.budgetMin;
        },
        message: "Maximum budget must be greater than or equal to minimum budget",
      },
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ==================== TIMELINE ====================
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Deadline must be in the future",
      },
    },

    estimatedDuration: {
      type: String,
      trim: true,
    },

    // ==================== LOCATION (Hyperlocal) ====================
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
    },

    isRemote: {
      type: Boolean,
      default: false,
    },

    // ==================== STATUS & REFERENCES ====================
    status: {
      type: String,
      enum: ["open", "in-progress", "completed", "cancelled"],
      default: "open",
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    proposalsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
// Ye search aur filters ko fast karte hain (Week 2 Day 12 ke liye)

gigSchema.index({ title: "text", description: "text" });
gigSchema.index({ category: 1 });
gigSchema.index({ status: 1 });
gigSchema.index({ "location.city": 1 });
gigSchema.index({ createdAt: -1 });

const Gig = mongoose.model("Gig", gigSchema);

export default Gig;