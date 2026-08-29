import asyncHandler from "express-async-handler";
import slugify from "slugify";
import Portfolio from "../models/Portfolio.js";
import { parseResume } from "../utils/resumeParser.js";
import { cloudinaryConfigured } from "../config/cloudinary.js";

// @route POST /api/portfolio/import-resume  (user, multipart "resume")
// Parses the uploaded PDF/DOCX and returns suggested field values — does NOT save
// anything, and the file itself is never written to disk (kept in memory only).
export const importResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Upload a PDF or DOCX resume under the 'resume' field");
  }
  const result = await parseResume(req.file.buffer, req.file.mimetype);
  res.json(result);
});

// @route GET /api/portfolio/me  (user)
export const getMyPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  res.json(portfolio);
});

// @route PUT /api/portfolio/me  (user) — the guided-form builder save
export const updateMyPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }

  const editable = [
    "fullName", "headline", "introduction", "location", "email", "phone",
    "github", "linkedin", "website", "avatarUrl", "skills", "experience",
    "projects", "certifications", "education", "achievements", "tags", "theme", "sourceResumeFileName",
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) portfolio[field] = req.body[field];
  });

  // Any edit after a rejection sends it back to "pending" for a fresh admin look
  if (portfolio.approvalStatus === "rejected") {
    portfolio.approvalStatus = "pending";
  }

  await portfolio.save();
  res.json(portfolio);
});

// @route POST /api/portfolio/me/avatar  (user, multipart "avatar")
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Upload an image under the 'avatar' field");
  }
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  // Cloudinary storage puts the hosted secure URL in req.file.path; local disk
  // storage puts a filesystem path there instead, so we branch on which is active.
  portfolio.avatarUrl = cloudinaryConfigured ? req.file.path : `/uploads/${req.file.filename}`;
  await portfolio.save();
  res.json({ avatarUrl: portfolio.avatarUrl });
});

// @route POST /api/portfolio/me/publish  (user)
// Owner requests to go live. This only sets isPublished=true if admin has already
// approved the profile; otherwise it flips approvalStatus back to pending for review.
export const publishMyPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }

  if (!portfolio.slug) {
    portfolio.slug = `${slugify(portfolio.fullName || "user", { lower: true, strict: true })}-${portfolio._id.toString().slice(-5)}`;
  }

  if (portfolio.approvalStatus === "approved") {
    portfolio.isPublished = true;
  } else {
    portfolio.approvalStatus = "pending";
    portfolio.isPublished = false;
  }
  await portfolio.save();

  res.json({
    isPublished: portfolio.isPublished,
    approvalStatus: portfolio.approvalStatus,
    message:
      portfolio.approvalStatus === "approved"
        ? "Your portfolio is now live."
        : "Submitted for admin review. It will go live once approved.",
  });
});

// @route POST /api/portfolio/me/unpublish (user)
export const unpublishMyPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  portfolio.isPublished = false;
  await portfolio.save();
  res.json({ isPublished: false });
});

// @route DELETE /api/portfolio/me (user) — self-service delete/export handled at account level
export const deleteMyPortfolio = asyncHandler(async (req, res) => {
  await Portfolio.findOneAndDelete({ user: req.user._id });
  res.json({ message: "Portfolio deleted" });
});

// public endpoints, no auth

// @route GET /api/portfolio/public  (landing page grid, search/filter, no login)
export const listPublicPortfolios = asyncHandler(async (req, res) => {
  const { q, tag, page = 1, limit = 12 } = req.query;
  const filter = { isPublished: true, approvalStatus: "approved" };
  if (tag) filter.tags = tag;
  if (q) filter.$text = { $search: q };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Portfolio.find(filter)
      .select("fullName headline avatarUrl tags slug theme updatedAt")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Portfolio.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @route GET /api/portfolio/public/:slug
export const getPublicPortfolioBySlug = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findOneAndUpdate(
    { slug: req.params.slug, isPublished: true, approvalStatus: "approved" },
    { $inc: { viewCount: 1 } },
    { new: true }
  );
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found or not published");
  }
  res.json(portfolio);
});

// @route POST /api/portfolio/public/:slug/click  (analytics: github/live link clicks)
export const trackClick = asyncHandler(async (req, res) => {
  const { type } = req.body; // "github" | "live"
  if (!["github", "live"].includes(type)) {
    res.status(400);
    throw new Error("Invalid click type");
  }
  await Portfolio.updateOne(
    { slug: req.params.slug },
    { $inc: { [`clickCounts.${type}`]: 1 } }
  );
  res.json({ ok: true });
});
