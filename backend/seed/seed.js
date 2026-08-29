import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import Article from "../models/Article.js";
import { rahulPortfolioData } from "./rahulPortfolioData.js";
import { cloudinary, cloudinaryConfigured } from "../config/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploads the demo avatar to Cloudinary (production-consistent) or copies it
// into the local /uploads static folder (dev fallback), and returns the URL
// to store on the seeded portfolio.
const resolveSeedAvatarUrl = async () => {
  const assetPath = path.join(__dirname, "assets", "rahul-avatar.jpg");

  if (cloudinaryConfigured) {
    const result = await cloudinary.uploader.upload(assetPath, {
      folder: "portfolio-builder/avatars",
      public_id: "rahul-prajapati-seed",
      overwrite: true,
      transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto", fetch_format: "auto" }],
    });
    return result.secure_url;
  }

  const uploadsDir = path.resolve("uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  fs.copyFileSync(assetPath, path.join(uploadsDir, "rahul-avatar.jpg"));
  return "/uploads/rahul-avatar.jpg";
};

const run = async () => {
  await connectDB();

  // Admin
  let admin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (!admin) {
    admin = await Admin.create({
      name: process.env.ADMIN_NAME || "Site Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
  }

  // Demo user: Rahul, from resume
  let user = await User.findOne({ email: rahulPortfolioData.email });
  if (!user) {
    user = await User.create({
      name: rahulPortfolioData.fullName,
      email: rahulPortfolioData.email,
      password: "TrainerLife@2026",

      accountStatus: "approved", // admin already permitted this profile
    });
  }

  const avatarUrl = await resolveSeedAvatarUrl();

  await Portfolio.findOneAndUpdate(
    { user: user._id },
    { user: user._id, ...rahulPortfolioData, avatarUrl },
    { upsert: true, new: true }
  );

  // A sample admin-authored article/roadmap
  const existingArticle = await Article.findOne({ slug: "mern-stack-roadmap-2026" });
  if (!existingArticle) {
    await Article.create({
      title: "MERN Stack Roadmap 2026",
      slug: "mern-stack-roadmap-2026",
      summary: "A structured path from JavaScript fundamentals to a deployed full-stack project.",
      content: "A step-by-step roadmap for learning the MERN stack, written for students moving from fundamentals to a deployed capstone project.",
      category: "Roadmap",
      tags: ["React", "Node", "MongoDB", "Express"],
      isRoadmap: true,
      isFeatured: true,
      roadmapSteps: [
        { title: "JavaScript & the DOM", description: "ES6+, async/await, fetch, DOM manipulation.", resources: [] },
        { title: "React fundamentals", description: "Components, hooks, state, routing.", resources: [] },
        { title: "Node.js & Express APIs", description: "REST APIs, middleware, error handling.", resources: [] },
        { title: "MongoDB & Mongoose", description: "Schema design, queries, aggregation.", resources: [] },
        { title: "Auth & deployment", description: "JWT auth, environment config, deploying to Vercel/Render.", resources: [] },
      ],
      createdBy: admin._id,
    });
  }

  console.log("Seed complete:");
  console.log(`  Admin login:  ${process.env.ADMIN_EMAIL} / (your ADMIN_PASSWORD)`);
  console.log(`  User login:   ${rahulPortfolioData.email} / TrainerLife@2026`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
