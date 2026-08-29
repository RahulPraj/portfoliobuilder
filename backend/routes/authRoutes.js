import express from "express";
import { registerUser, loginUser, loginAdmin, refresh, logout } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/admin/login", authLimiter, loginAdmin);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
