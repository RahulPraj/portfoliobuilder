import express from "express";
import { listArticles, getArticleBySlug } from "../controllers/articleController.js";

const router = express.Router();
router.get("/", listArticles);
router.get("/:slug", getArticleBySlug);

export default router;
