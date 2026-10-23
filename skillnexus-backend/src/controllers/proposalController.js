import Proposal from "../models/Proposal.js";
import Gig from "../models/Gig.js";

// ==================== SUBMIT PROPOSAL ====================
// POST /api/gigs/:gigId/proposals
// Private route (only freelancers)

export const submitProposal = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { coverLetter, bidAmount, estimatedDays, attachments } = req.body;

    // ==================== VALIDATION ====================
    if (!coverLetter || !bidAmount || !estimatedDays) {
      return res.status(400).json({
        success: false,
        message: "Please provide coverLetter, bidAmount and estimatedDays",
      });
    }

    // ==================== FIND GIG ====================
    const gig = await Gig.findById(gigId);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    // ==================== CHECK GIG STATUS ====================
    if (gig.status !== "open") {
      return res.status(400).json({
        success: false,
        message: `Cannot submit proposal. Gig status is '${gig.status}'`,
      });
    }

    // ==================== PREVENT SELF-PROPOSAL ====================
    // Client khud apne gig pe proposal nahi bhej sakta
    if (gig.client.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot submit a proposal on your own gig",
      });
    }

    // ==================== CHECK EXISTING PROPOSAL ====================
    const existingProposal = await Proposal.findOne({
      gig: gigId,
      freelancer: req.user._id,
    });

    if (existingProposal) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a proposal for this gig",
      });
    }

    // ==================== CREATE PROPOSAL ====================
    const proposal = await Proposal.create({
      gig: gigId,
      freelancer: req.user._id,
      coverLetter,
      bidAmount,
      estimatedDays,
      attachments: attachments || [],
    });

    // ==================== INCREMENT COUNTER ====================
    await Gig.findByIdAndUpdate(gigId, { $inc: { proposalsCount: 1 } });

    // ==================== RESPONSE ====================
    res.status(201).json({
      success: true,
      message: "Proposal submitted successfully",
      data: proposal,
    });
  } catch (error) {
    console.error("Submit proposal error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a proposal for this gig",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid gig ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// ==================== GET PROPOSALS FOR A GIG ====================
// GET /api/gigs/:gigId/proposals
// Private route (only gig owner)

export const getGigProposals = async (req, res) => {
  try {
    const { gigId } = req.params;

    // ==================== FIND GIG ====================
    const gig = await Gig.findById(gigId);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    // ==================== OWNERSHIP CHECK ====================
    // Sirf gig owner apne gig ke proposals dekh sakta hai
    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view proposals for this gig",
      });
    }

    // ==================== FIND PROPOSALS ====================
    const proposals = await Proposal.find({ gig: gigId })
      .populate("freelancer", "name email avatar location isEmailVerified")
      .sort({ createdAt: -1 });   // latest pehle

    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error) {
    console.error("Get gig proposals error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid gig ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// ==================== GET MY PROPOSALS ====================
// GET /api/proposals/my
// Private route (only freelancers)
// Freelancer apne saare proposals dekhe

export const getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate("gig", "title category budgetMin budgetMax deadline status location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (error) {
    console.error("Get my proposals error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// ==================== WITHDRAW PROPOSAL ====================
// DELETE /api/proposals/:id
// Private route (only freelancer who submitted)

export const withdrawProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    // ==================== OWNERSHIP CHECK ====================
    if (proposal.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to withdraw this proposal",
      });
    }

    // ==================== STATUS CHECK ====================
    if (proposal.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Cannot withdraw an accepted proposal",
      });
    }

    // ==================== DELETE + DECREMENT ====================
    const gigId = proposal.gig;
    await proposal.deleteOne();
    await Gig.findByIdAndUpdate(gigId, { $inc: { proposalsCount: -1 } });

    res.status(200).json({
      success: true,
      message: "Proposal withdrawn successfully",
    });
  } catch (error) {
    console.error("Withdraw proposal error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid proposal ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};
// ==================== ACCEPT PROPOSAL ====================
// PUT /api/proposals/:id/accept
// Private route (only gig owner)

export const acceptProposal = async (req, res) => {
    try {
      const { id } = req.params;
  
      // ==================== FIND PROPOSAL (RAW) ====================
      // Pehle proposal dhundo, taaki gig ID mil jaaye
      const existingProposal = await Proposal.findById(id);
  
      if (!existingProposal) {
        return res.status(404).json({
          success: false,
          message: "Proposal not found",
        });
      }
  
      // ==================== FIND GIG ====================
      const gig = await Gig.findById(existingProposal.gig);
  
      if (!gig) {
        return res.status(404).json({
          success: false,
          message: "Associated gig not found",
        });
      }
  
      // ==================== OWNERSHIP CHECK ====================
      // Sirf gig owner proposal accept kar sakta hai
      if (gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to accept this proposal",
        });
      }
  
      // ==================== GIG STATUS CHECK ====================
      if (gig.status !== "open") {
        return res.status(400).json({
          success: false,
          message: `Cannot accept proposal. Gig status is '${gig.status}'`,
        });
      }
  
      // ==================== ATOMIC ACCEPT ====================
      // Sirf tab update karo jab status "pending" ho
      // Ye race condition prevent karta hai
      const proposal = await Proposal.findOneAndUpdate(
        { _id: id, status: "pending" },
        {
          status: "accepted",
          respondedAt: new Date(),
          clientResponse: "Congratulations! Your proposal has been accepted.",
        },
        { new: true }
      );
  
      if (!proposal) {
        return res.status(400).json({
          success: false,
          message: "Proposal has already been processed",
        });
      }
  
      // ==================== AUTO-REJECT OTHER PROPOSALS ====================
      await Proposal.updateMany(
        {
          gig: gig._id,
          _id: { $ne: proposal._id },
          status: "pending",
        },
        {
          status: "rejected",
          clientResponse: "Position has been filled by another freelancer.",
          respondedAt: new Date(),
        }
      );
  
      // ==================== UPDATE GIG ====================
      gig.assignedFreelancer = proposal.freelancer;
      gig.status = "in-progress";
      await gig.save();
  
      // ==================== RESPONSE ====================
      const populatedProposal = await Proposal.findById(proposal._id)
        .populate("freelancer", "name email avatar location")
        .populate("gig", "title category budgetMin budgetMax status");
  
      res.status(200).json({
        success: true,
        message: "Proposal accepted successfully. Other proposals have been rejected.",
        data: populatedProposal,
      });
    } catch (error) {
      console.error("Accept proposal error:", error.message);
  
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid proposal ID format",
        });
      }
  
      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  };
  
  // ==================== REJECT PROPOSAL ====================
  // PUT /api/proposals/:id/reject
  // Private route (only gig owner)
  
  export const rejectProposal = async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
  
      // ==================== FIND PROPOSAL ====================
      const existingProposal = await Proposal.findById(id);
  
      if (!existingProposal) {
        return res.status(404).json({
          success: false,
          message: "Proposal not found",
        });
      }
  
      // ==================== FIND GIG ====================
      const gig = await Gig.findById(existingProposal.gig);
  
      if (!gig) {
        return res.status(404).json({
          success: false,
          message: "Associated gig not found",
        });
      }
  
      // ==================== OWNERSHIP CHECK ====================
      if (gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to reject this proposal",
        });
      }
  
      // ==================== ATOMIC REJECT ====================
      const proposal = await Proposal.findOneAndUpdate(
        { _id: id, status: "pending" },
        {
          status: "rejected",
          respondedAt: new Date(),
          clientResponse: reason || "Your proposal was not selected for this gig.",
        },
        { new: true }
      );
  
      if (!proposal) {
        return res.status(400).json({
          success: false,
          message: "Proposal has already been processed",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Proposal rejected successfully",
        data: proposal,
      });
    } catch (error) {
      console.error("Reject proposal error:", error.message);
  
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid proposal ID format",
        });
      }
  
      res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  };