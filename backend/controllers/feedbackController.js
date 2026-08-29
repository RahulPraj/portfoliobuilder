import asyncHandler from "express-async-handler";
import crypto from "crypto";
import Feedback from "../models/Feedback.js";
import Portfolio from "../models/Portfolio.js";
import User from "../models/User.js";
import {
  contactApprovalEmailToOwner,
  contactDecisionEmailToVisitor,
} from "../utils/sendEmail.js";

// @route POST /api/portfolio/public/:slug/feedback  (public, rate-limited)
// Visitor submits feedback/contact request. PRIVATE to the owner until approved.
export const submitFeedback = asyncHandler(async (req, res) => {
  const { visitorName, visitorEmail, message, requestType } = req.body;
  if (!visitorName || !visitorEmail || !message) {
    res.status(400);
    throw new Error("Name, email and message are required");
  }

  const portfolio = await Portfolio.findOne({ slug: req.params.slug, isPublished: true });
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }

  const feedback = await Feedback.create({
    portfolio: portfolio._id,
    owner: portfolio.user,
    visitorName,
    visitorEmail,
    message,
    requestType: requestType === "contact" ? "contact" : "feedback",
  });

  if (feedback.requestType === "contact") {
    const rawToken = feedback.generateApprovalToken();
    await feedback.save();

    const owner = await User.findById(portfolio.user);
    const base = process.env.CLIENT_URL;
    const approveUrl = `${base}/api/feedback/${feedback._id}/decide?token=${rawToken}&action=approve`;
    const rejectUrl = `${base}/api/feedback/${feedback._id}/decide?token=${rawToken}&action=reject`;
    contactApprovalEmailToOwner(owner, feedback, approveUrl, rejectUrl).catch(() => {});
  }

  res.status(201).json({
    message: "Thanks — your message is pending the portfolio owner's approval.",
  });
});

// @route GET /api/feedback/me  (user — owner's inbox, message content visible ONLY to them)
export const listMyFeedback = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findOne({ user: req.user._id });
  const items = await Feedback.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(items);
});

// @route PATCH /api/feedback/:id/approve  (user — owner decides, from dashboard)
export const approveFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({ _id: req.params.id, owner: req.user._id });
  if (!feedback) {
    res.status(404);
    throw new Error("Request not found");
  }
  feedback.status = "approved";
  feedback.decidedAt = new Date();
  await feedback.save();

  contactDecisionEmailToVisitor(feedback, true, {
    email: req.user.email,
    linkedin: req.body.linkedin,
  }).catch(() => {});

  res.json({ message: "Approved — contact details released to the visitor", feedback });
});

// @route PATCH /api/feedback/:id/reject  (user)
export const rejectFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({ _id: req.params.id, owner: req.user._id });
  if (!feedback) {
    res.status(404);
    throw new Error("Request not found");
  }
  feedback.status = "rejected";
  feedback.decidedAt = new Date();
  await feedback.save();

  contactDecisionEmailToVisitor(feedback, false, {}).catch(() => {});
  res.json({ message: "Rejected", feedback });
});

// one-click approve/reject straight from the email, no login needed

// @route GET /api/feedback/:id/decide?token=...&action=approve|reject
// No dashboard/login needed. Single-use, time-limited, secured by a hashed token.
export const decideFromEmail = asyncHandler(async (req, res) => {
  const { token, action } = req.query;
  if (!token || !["approve", "reject"].includes(action)) {
    res.status(400);
    throw new Error("Invalid decision link");
  }

  const hashed = crypto.createHash("sha256").update(String(token)).digest("hex");
  const feedback = await Feedback.findById(req.params.id).select(
    "+approvalToken +approvalTokenExpires +approvalTokenUsed"
  );

  const invalid =
    !feedback ||
    feedback.approvalToken !== hashed ||
    feedback.approvalTokenUsed ||
    feedback.approvalTokenExpires < new Date();

  if (invalid) {
    res.status(400);
    throw new Error("This link is invalid, expired, or has already been used.");
  }

  feedback.status = action === "approve" ? "approved" : "rejected";
  feedback.decidedAt = new Date();
  feedback.approvalTokenUsed = true;
  await feedback.save();

  const owner = await User.findById(feedback.owner);
  contactDecisionEmailToVisitor(feedback, action === "approve", {
    email: owner.email,
  }).catch(() => {});

  res.send(
    `<html><body style="font-family:sans-serif;padding:2rem"><h2>Request ${feedback.status}</h2>
     <p>You can close this tab.</p></body></html>`
  );
});
