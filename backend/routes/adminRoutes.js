import express from "express";
import { protectAdmin } from "../middleware/authMiddleware.js";
import {
  listUsers,
  getNotifications,
  getStats,
  approveUserAccount,
  suspendUserAccount,
  deleteUserAccount,
  listPendingPortfolios,
  approvePortfolio,
  rejectPortfolio,
} from "../controllers/adminController.js";
import { createArticle, updateArticle, deleteArticle, listArticlesAdmin, togglePublishArticle } from "../controllers/articleController.js";

const router = express.Router();
router.use(protectAdmin); // everything below requires an admin token

router.get("/stats", getStats);
router.get("/users", listUsers);
router.get("/notifications", getNotifications);
router.patch("/users/:id/approve", approveUserAccount);
router.patch("/users/:id/suspend", suspendUserAccount);
router.delete("/users/:id", deleteUserAccount);

router.get("/portfolios/pending", listPendingPortfolios);
router.patch("/portfolios/:id/approve", approvePortfolio);
router.patch("/portfolios/:id/reject", rejectPortfolio);

router.get("/articles", listArticlesAdmin);
router.post("/articles", createArticle);
router.put("/articles/:id", updateArticle);
router.patch("/articles/:id/publish", togglePublishArticle);
router.delete("/articles/:id", deleteArticle);

export default router;
