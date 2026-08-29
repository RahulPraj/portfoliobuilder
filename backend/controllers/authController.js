import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Portfolio from "../models/Portfolio.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} from "../utils/generateTokens.js";
import { newAccountEmailToAdmin } from "../utils/sendEmail.js";

// user auth

// @route POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password });

  // Create an empty draft portfolio shell so the builder has somewhere to write to
  await Portfolio.create({ user: user._id, fullName: name, email });

  // let admins know a new account needs review
  const admins = await Admin.find().select("email");
  await Promise.all(admins.map((a) => newAccountEmailToAdmin(a.email, user).catch(() => {})));

  const accessToken = signAccessToken({ id: user._id, role: "user" });
  const refreshToken = signRefreshToken({ id: user._id, role: "user" });
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  res.status(201).json({
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
    },
    message: "Account created. It will be reviewed by an admin before your portfolio can go live.",
  });
});

// @route POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const accessToken = signAccessToken({ id: user._id, role: "user" });
  const refreshToken = signRefreshToken({ id: user._id, role: "user" });
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  res.json({
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
    },
  });
});

// admin auth

// @route POST /api/auth/admin/login
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email: email?.toLowerCase() }).select("+password");
  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const accessToken = signAccessToken({ id: admin._id, role: "admin" });
  const refreshToken = signRefreshToken({ id: admin._id, role: "admin" });
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  res.json({
    accessToken,
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

// shared

// @route POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401);
    throw new Error("No refresh token");
  }
  try {
    const decoded = verifyRefreshToken(token);
    const accessToken = signAccessToken({ id: decoded.id, role: decoded.role });
    res.json({ accessToken });
  } catch {
    res.status(401);
    throw new Error("Refresh token invalid or expired");
  }
});

// @route POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  res.json({ message: "Logged out" });
});
