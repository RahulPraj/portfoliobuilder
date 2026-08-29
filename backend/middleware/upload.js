import multer from "multer";
import path from "path";
import fs from "fs";
import { CloudinaryStorage } from "multer-storage-cloudinary-v2";
import { cloudinary, cloudinaryConfigured } from "../config/cloudinary.js";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedDocTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

// avatar upload — cloudinary when configured (needed in prod since
// Render/Vercel wipe local disk on redeploy), local disk as a dev fallback
let avatarStorage;
if (cloudinaryConfigured) {
  avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "portfolio-builder/avatars",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 800, height: 800, crop: "limit", quality: "auto", fetch_format: "auto" },
      ],
    },
  });
} else {
  const uploadRoot = path.resolve("uploads");
  if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
  avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadRoot),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, "_");
      cb(null, `${Date.now()}-${safeBase}${ext}`);
    },
  });
}

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error("Avatar must be a JPEG, PNG, or WebP image"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// resume upload — memory only, we parse it right away and don't keep the file
export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!allowedDocTypes.includes(file.mimetype)) {
      return cb(new Error("Resume must be a PDF or DOCX file"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});
