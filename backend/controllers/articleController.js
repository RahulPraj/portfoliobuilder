import asyncHandler from "express-async-handler";
import slugify from "slugify";
import Article from "../models/Article.js";

// @route GET /api/articles  (public, search + category filter)
export const listArticles = asyncHandler(async (req, res) => {
  const { q, category, isRoadmap, page = 1, limit = 12 } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (isRoadmap !== undefined) filter.isRoadmap = isRoadmap === "true";
  if (q) filter.$or = [{ title: new RegExp(q, "i") }, { tags: new RegExp(q, "i") }];

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Article.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
    Article.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @route GET /api/articles/:slug
export const getArticleBySlug = asyncHandler(async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug, isPublished: true });
  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }
  res.json(article);
});

// @route GET /api/admin/articles  (admin — sees drafts/unpublished too)
export const listArticlesAdmin = asyncHandler(async (req, res) => {
  const { isRoadmap } = req.query;
  const filter = {};
  if (isRoadmap !== undefined) filter.isRoadmap = isRoadmap === "true";
  const items = await Article.find(filter).sort({ createdAt: -1 });
  res.json(items);
});

// @route PATCH /api/admin/articles/:id/publish  (admin)
export const togglePublishArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }
  article.isPublished = req.body.isPublished ?? !article.isPublished;
  await article.save();
  res.json(article);
});

// @route POST /api/admin/articles  (admin)
export const createArticle = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const slug = slugify(title, { lower: true, strict: true });
  const article = await Article.create({
    ...req.body,
    slug,
    createdBy: req.admin._id,
  });
  res.status(201).json(article);
});

// @route PUT /api/admin/articles/:id  (admin)
export const updateArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }
  Object.assign(article, req.body);
  if (req.body.title) article.slug = slugify(req.body.title, { lower: true, strict: true });
  await article.save();
  res.json(article);
});

// @route DELETE /api/admin/articles/:id  (admin)
export const deleteArticle = asyncHandler(async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.json({ message: "Article deleted" });
});
