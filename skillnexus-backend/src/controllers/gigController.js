import Gig from "../models/Gig.js";

// ==================== CREATE GIG ====================
// POST /api/gigs
// Private route (only clients)

export const createGig = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      skillsRequired,
      budgetType,
      budgetMin,
      budgetMax,
      deadline,
      estimatedDuration,
      location,
      isRemote,
    } = req.body;

    // Validation
    if (!title || !description || !category || !budgetMin || !budgetMax || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: title, description, category, budgetMin, budgetMax, deadline",
      });
    }

    if (!skillsRequired || !Array.isArray(skillsRequired) || skillsRequired.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one skill is required",
      });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Deadline must be a valid future date",
      });
    }

    // Create Gig
    const gig = await Gig.create({
      title,
      description,
      category,
      skillsRequired,
      budgetType: budgetType || "fixed",
      budgetMin,
      budgetMax,
      deadline: deadlineDate,
      estimatedDuration,
      location: location || undefined,
      isRemote: isRemote || false,
      client: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Gig created successfully",
      data: gig,
    });
  } catch (error) {
    console.error("Create gig error:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

// ==================== GET ALL GIGS (ADVANCED SEARCH) ====================
// GET /api/gigs
// Public route

export const getAllGigs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = "open", // Default: sirf open gigs dikhao
      city,
      minBudget,
      maxBudget,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // ==================== BUILD FILTER ====================
    const filter = {};

    // Basic filters
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (city) filter["location.city"] = new RegExp(city, "i");

    // ==================== SMART BUDGET FILTER ====================
    // Logic: Overlap check. 
    // User ka minBudget gig ke maxBudget se kam hona chahiye
    // User ka maxBudget gig ke minBudget se zyada hona chahiye
    if (minBudget || maxBudget) {
      filter.$and = filter.$and || [];
      
      if (maxBudget) {
        // Gig ka minimum budget user ke maximum budget se kam ya equal ho
        filter.$and.push({ budgetMin: { $lte: Number(maxBudget) } });
      }
      if (minBudget) {
        // Gig ka maximum budget user ke minimum budget se zyada ya equal ho
        filter.$and.push({ budgetMax: { $gte: Number(minBudget) } });
      }
    }

    // ==================== TEXT SEARCH ====================
    if (search) {
      // MongoDB text search (title aur description dono mein dhundhta hai)
      filter.$text = { $search: search };
    }

    // ==================== PAGINATION ====================
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // ==================== ADVANCED SORTING ====================
    let sort = { createdAt: -1 }; // Default: newest first

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    if (sortBy === "createdAt") sort = { createdAt: sortDirection };
    else if (sortBy === "budgetMax") sort = { budgetMax: sortDirection };
    else if (sortBy === "budgetMin") sort = { budgetMin: sortDirection };
    else if (sortBy === "deadline") sort = { deadline: sortDirection };
    
    // Agar text search active hai, toh relevance score se sort karo (advanced)
    if (search) {
      sort = { score: { $meta: "textScore" } }; 
    }

    // ==================== QUERY ====================
    const query = Gig.find(filter)
      .populate("client", "name email avatar location")
      .skip(skip)
      .limit(limitNum);

    // Agar search hai, toh projection mein score add karo
    if (search) {
      query.select({ score: { $meta: "textScore" } }).sort(sort);
    } else {
      query.sort(sort);
    }

    const [gigs, total] = await Promise.all([
      query,
      Gig.countDocuments(filter),
    ]);

    // ==================== RESPONSE ====================
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: gigs.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: gigs,
    });
  } catch (error) {
    console.error("Get all gigs error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// ==================== GET SINGLE GIG ====================
// GET /api/gigs/:id
// Public route

export const getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate("client", "name email avatar location createdAt")
      .populate("assignedFreelancer", "name email avatar");

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    res.status(200).json({ success: true, data: gig });
  } catch (error) {
    console.error("Get gig error:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid gig ID format" });
    }
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

// ==================== UPDATE GIG ====================
// PUT /api/gigs/:id
// Private route (only owner)

export const updateGig = async (req, res) => {
  try {
    let gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to update this gig" });
    }

    // In fields ko update mat hone do
    delete req.body.client;
    delete req.body.assignedFreelancer;
    delete req.body.proposalsCount;
    delete req.body.status;

    gig = await Gig.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("client", "name email avatar");

    res.status(200).json({ success: true, message: "Gig updated successfully", data: gig });
  } catch (error) {
    console.error("Update gig error:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid gig ID format" });
    }
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

// ==================== DELETE GIG ====================
// DELETE /api/gigs/:id
// Private route (only owner)

export const deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to delete this gig" });
    }

    if (gig.status === "in-progress" || gig.status === "completed") {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete gig with status '${gig.status}'.` 
      });
    }

    await gig.deleteOne();

    res.status(200).json({ success: true, message: "Gig deleted successfully", data: { _id: gig._id } });
  } catch (error) {
    console.error("Delete gig error:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid gig ID format" });
    }
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};