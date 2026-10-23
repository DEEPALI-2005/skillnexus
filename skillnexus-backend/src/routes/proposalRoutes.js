import express from "express";
import {
  getMyProposals,
  withdrawProposal,
  acceptProposal,
  rejectProposal,
} from "../controllers/proposalController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==================== PROPOSAL ROUTES ====================

// GET /api/proposals/my - Freelancer's own proposals
router.get("/my", protect, authorizeRoles("freelancer"), getMyProposals);

// PUT /api/proposals/:id/accept - Accept proposal (client only)
router.put("/:id/accept", protect, authorizeRoles("client"), acceptProposal);

// PUT /api/proposals/:id/reject - Reject proposal (client only)
router.put("/:id/reject", protect, authorizeRoles("client"), rejectProposal);

// DELETE /api/proposals/:id - Withdraw proposal (freelancer only)
router.delete("/:id", protect, authorizeRoles("freelancer"), withdrawProposal);

export default router;