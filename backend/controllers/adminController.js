import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import Article from "../models/Article.js";
import { accountApprovedEmail, portfolioApprovedEmail, portfolioRejectedEmail } from "../utils/sendEmail.js";

// @route GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, pendingAccounts, publishedPortfolios, pendingPortfolios, totalArticles, totalRoadmaps] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: "pending" }),
      Portfolio.countDocuments({ isPublished: true, approvalStatus: "approved" }),
      Portfolio.countDocuments({ approvalStatus: "pending" }),
      Article.countDocuments({ isRoadmap: false }),
      Article.countDocuments({ isRoadmap: true }),
    ]);
  res.json({ totalUsers, pendingAccounts, publishedPortfolios, pendingPortfolios, totalArticles, totalRoadmaps });
});

// @route GET /api/admin/users  (pagination + search)
export const listUsers = asyncHandler(async (req, res) => {
  const { q, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.accountStatus = status;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @route GET /api/admin/notifications
// New pending accounts + newly-published portfolios awaiting review
export const getNotifications = asyncHandler(async (req, res) => {
  const [pendingAccounts, pendingPortfolios] = await Promise.all([
    User.find({ accountStatus: "pending" }).select("name email createdAt").sort({ createdAt: -1 }),
    Portfolio.find({ approvalStatus: "pending" })
      .select("fullName updatedAt user")
      .sort({ updatedAt: -1 }),
  ]);
  res.json({ pendingAccounts, pendingPortfolios });
});

// @route PATCH /api/admin/users/:id/approve  — Admin "permits" the user account
export const approveUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.accountStatus = "approved";
  await user.save();
  accountApprovedEmail(user).catch(() => {});
  res.json({ message: "Account approved", user });
});

// @route PATCH /api/admin/users/:id/suspend
export const suspendUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { accountStatus: "suspended" },
    { new: true }
  );
  res.json({ message: "Account suspended", user });
});

// @route DELETE /api/admin/users/:id  — with confirmation handled client-side
export const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  await Portfolio.findOneAndDelete({ user: user._id });
  await user.deleteOne();
  res.json({ message: "Account and portfolio deleted" });
});

// portfolio moderation — this is where an admin actually "permits" a profile

// @route GET /api/admin/portfolios/pending
export const listPendingPortfolios = asyncHandler(async (req, res) => {
  const items = await Portfolio.find({ approvalStatus: "pending" })
    .populate("user", "name email accountStatus")
    .sort({ updatedAt: -1 });
  res.json(items);
});

// @route PATCH /api/admin/portfolios/:id/approve
export const approvePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findById(req.params.id);
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  portfolio.approvalStatus = "approved";
  portfolio.approvalNote = req.body.note || "";
  // Owner still has final say on visibility, but if they'd already asked to publish, go live now
  if (portfolio.isPublished === false && req.body.autoPublish) {
    portfolio.isPublished = true;
  }
  await portfolio.save();

  const owner = await User.findById(portfolio.user);
  if (owner) portfolioApprovedEmail(owner, portfolio).catch((e) => console.error("[email] approval notice failed:", e.message));

  res.json({ message: "Portfolio approved", portfolio });
});

// @route PATCH /api/admin/portfolios/:id/reject
export const rejectPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findById(req.params.id);
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  portfolio.approvalStatus = "rejected";
  portfolio.approvalNote = req.body.note || "Please review and resubmit.";
  portfolio.isPublished = false;
  await portfolio.save();

  const owner = await User.findById(portfolio.user);
  if (owner) portfolioRejectedEmail(owner, portfolio).catch((e) => console.error("[email] rejection notice failed:", e.message));

  res.json({ message: "Portfolio rejected", portfolio });
});
