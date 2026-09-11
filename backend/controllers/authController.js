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

// ======================================================
// USER REGISTER
// POST /api/auth/register
// ======================================================

export const registerUser = asyncHandler(async (req, res) => {
  console.log("REGISTER 1: Request received");

  const { name, email, password } = req.body;

  console.log("REGISTER 2: Request body received");

  // Validate input
  if (!name || !email || !password) {
    res.status(400);
    throw new Error(
      "Name, email and password are required"
    );
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error(
      "Password must be at least 8 characters"
    );
  }

  const normalizedEmail = email
    .toLowerCase()
    .trim();

  // ====================================================
  // Check existing user
  // ====================================================

  console.log("REGISTER 3: Checking existing user");

  const exists = await User.findOne({
    email: normalizedEmail,
  });

  console.log("REGISTER 4: User check completed");

  if (exists) {
    res.status(409);
    throw new Error(
      "An account with this email already exists"
    );
  }

  // ====================================================
  // Create user
  // ====================================================

  console.log("REGISTER 5: Creating user");

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  console.log("REGISTER 6: User created");

  // ====================================================
  // Create portfolio
  // ====================================================

  console.log("REGISTER 7: Creating portfolio");

  await Portfolio.create({
    user: user._id,
    fullName: name.trim(),
    email: normalizedEmail,
  });

  console.log("REGISTER 8: Portfolio created");

  // ====================================================
  // Generate tokens
  // ====================================================

  console.log("REGISTER 9: Generating tokens");

  const accessToken = signAccessToken({
    id: user._id,
    role: "user",
  });

  const refreshToken = signRefreshToken({
    id: user._id,
    role: "user",
  });

  // ====================================================
  // Set refresh token cookie
  // ====================================================

  res.cookie(
    "refreshToken",
    refreshToken,
    refreshCookieOptions
  );

  // ====================================================
  // Send response immediately
  // ====================================================

  res.status(201).json({
    accessToken,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountStatus: user.accountStatus,
    },

    message:
      "Account created. It will be reviewed by an admin before your portfolio can go live.",
  });

  console.log("REGISTER 10: Response sent");

  // ====================================================
  // Notify admins
  //
  // IMPORTANT:
  // Email is handled AFTER the response.
  // A Gmail/SMTP problem will not block registration.
  // ====================================================

  try {
    console.log("REGISTER 11: Finding admins");

    const admins = await Admin.find()
      .select("email")
      .lean();

    console.log(
      `REGISTER 12: Found ${admins.length} admin(s)`
    );

    for (const admin of admins) {
      try {
        console.log(
          `REGISTER 13: Sending email to ${admin.email}`
        );

        await Promise.race([
          newAccountEmailToAdmin(
            admin.email,
            user
          ),

          new Promise((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  "Email sending timed out"
                )
              );
            }, 10000);
          }),
        ]);

        console.log(
          `REGISTER 14: Email sent to ${admin.email}`
        );
      } catch (emailError) {
        console.error(
          `REGISTER EMAIL ERROR for ${admin.email}:`,
          emailError.message
        );
      }
    }

    console.log(
      "REGISTER 15: Admin notification completed"
    );
  } catch (error) {
    console.error(
      "REGISTER ADMIN NOTIFICATION ERROR:",
      error.message
    );
  }
});

// ======================================================
// USER LOGIN
// POST /api/auth/login
// ======================================================

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email: email?.toLowerCase().trim(),
  }).select("+password");

  if (
    !user ||
    !(await user.matchPassword(password))
  ) {
    res.status(401);
    throw new Error(
      "Invalid email or password"
    );
  }

  const accessToken = signAccessToken({
    id: user._id,
    role: "user",
  });

  const refreshToken = signRefreshToken({
    id: user._id,
    role: "user",
  });

  res.cookie(
    "refreshToken",
    refreshToken,
    refreshCookieOptions
  );

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

// ======================================================
// ADMIN LOGIN
// POST /api/auth/admin/login
// ======================================================

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({
    email: email?.toLowerCase().trim(),
  }).select("+password");

  if (
    !admin ||
    !(await admin.matchPassword(password))
  ) {
    res.status(401);
    throw new Error(
      "Invalid email or password"
    );
  }

  const accessToken = signAccessToken({
    id: admin._id,
    role: "admin",
  });

  const refreshToken = signRefreshToken({
    id: admin._id,
    role: "admin",
  });

  res.cookie(
    "refreshToken",
    refreshToken,
    refreshCookieOptions
  );

  res.json({
    accessToken,

    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
    },
  });
});

// ======================================================
// REFRESH TOKEN
// POST /api/auth/refresh
// ======================================================

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("No refresh token");
  }

  try {
    const decoded = verifyRefreshToken(token);

    const accessToken = signAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    res.json({
      accessToken,
    });
  } catch {
    res.status(401);
    throw new Error(
      "Refresh token invalid or expired"
    );
  }
});

// ======================================================
// LOGOUT
// POST /api/auth/logout
// ======================================================

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", {
    path: "/api/auth/refresh",
  });

  res.json({
    message: "Logged out",
  });
});