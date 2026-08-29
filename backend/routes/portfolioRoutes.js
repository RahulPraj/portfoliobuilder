import express from "express";
import { protectUser } from "../middleware/authMiddleware.js";
import { avatarUpload, resumeUpload } from "../middleware/upload.js";
import { publicFormLimiter } from "../middleware/rateLimiters.js";
import {
  importResume,
  getMyPortfolio,
  updateMyPortfolio,
  uploadAvatar,
  publishMyPortfolio,
  unpublishMyPortfolio,
  deleteMyPortfolio,
  listPublicPortfolios,
  getPublicPortfolioBySlug,
  trackClick,
} from "../controllers/portfolioController.js";
import { submitFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

// Public
router.get("/public", listPublicPortfolios);
router.get("/public/:slug", getPublicPortfolioBySlug);
router.post("/public/:slug/click", trackClick);
router.post("/public/:slug/feedback", publicFormLimiter, submitFeedback);

// User (authenticated)
router.get("/me", protectUser, getMyPortfolio);
router.put("/me", protectUser, updateMyPortfolio);
router.post("/me/avatar", protectUser, avatarUpload.single("avatar"), uploadAvatar);
router.post("/me/publish", protectUser, publishMyPortfolio);
router.post("/me/unpublish", protectUser, unpublishMyPortfolio);
router.delete("/me", protectUser, deleteMyPortfolio);
router.post("/import-resume", protectUser, resumeUpload.single("resume"), importResume);

export default router;
