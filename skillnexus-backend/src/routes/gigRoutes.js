import express from "express";
import {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  deleteGig,
} from "../controllers/gigController.js";
import {
  submitProposal,
  getGigProposals,
} from "../controllers/proposalController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.get("/", getAllGigs);
router.get("/:id", getGigById);

// ==================== PRIVATE ROUTES (CLIENT) ====================
router.post("/", protect, authorizeRoles("client"), createGig);
router.put("/:id", protect, authorizeRoles("client"), updateGig);
router.delete("/:id", protect, authorizeRoles("client"), deleteGig);

// ==================== PROPOSAL ROUTES (NESTED) ====================

// Freelancer: Submit proposal for a gig
router.post(
  "/:gigId/proposals",
  protect,
  authorizeRoles("freelancer"),
  submitProposal
);

// Client: Get all proposals for a gig (owner only)
router.get(
  "/:gigId/proposals",
  protect,
  authorizeRoles("client"),
  getGigProposals
);

export default router;