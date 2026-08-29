import express from "express";
import { protectUser } from "../middleware/authMiddleware.js";
import {
  listMyFeedback,
  approveFeedback,
  rejectFeedback,
  decideFromEmail,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.get("/me", protectUser, listMyFeedback);
router.patch("/:id/approve", protectUser, approveFeedback);
router.patch("/:id/reject", protectUser, rejectFeedback);
router.get("/:id/decide", decideFromEmail); // secured by single-use token, not a session

export default router;
