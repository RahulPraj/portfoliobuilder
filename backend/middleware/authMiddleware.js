import asyncHandler from "express-async-handler";
import { verifyAccessToken } from "../utils/generateTokens.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

// Requires a valid access token for a USER (Bearer header)
export const protectUser = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized — no token");
  }
  try {
    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);
    if (decoded.role !== "user") {
      res.status(403);
      throw new Error("This action requires a user account");
    }
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      res.status(401);
      throw new Error("User no longer exists");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized — invalid or expired token");
  }
});

// Requires a valid access token for an ADMIN
export const protectAdmin = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized — no token");
  }
  try {
    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);
    if (decoded.role !== "admin") {
      res.status(403);
      throw new Error("Admin access only");
    }
    req.admin = await Admin.findById(decoded.id);
    if (!req.admin) {
      res.status(401);
      throw new Error("Admin no longer exists");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized — invalid or expired token");
  }
});
