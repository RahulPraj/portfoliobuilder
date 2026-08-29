import mongoose from "mongoose";

// None of these sub-fields are required — a user might only have a title and
// no dates yet, or a project with no description. Résumé extraction can also
// legitimately produce a blank field, and that should never block a save.
const experienceSchema = new mongoose.Schema(
  {
    role: String,
    company: String,
    location: String,
    startDate: String,
    endDate: { type: String, default: "Present" },
    bullets: [String],
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    bullets: [String],
    techStack: [String],
    githubUrl: String,
    liveUrl: String,
    image: String, // cover image / screenshot
    featured: { type: Boolean, default: false },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  { title: String, issuer: String, year: String, description: String },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    institution: String,
    degree: String,
    duration: String,
    score: String,
  },
  { _id: false }
);

const achievementSchema = new mongoose.Schema(
  { title: String, description: String, year: String },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    // core profile fields
    fullName: { type: String, required: true },
    headline: { type: String, default: "" }, // e.g. "MERN Stack Developer & Technical Trainer"
    introduction: { type: String, default: "" },
    location: String,
    email: String,
    phone: String,
    github: String,
    linkedin: String,
    website: String,

    avatarUrl: { type: String, default: "" }, // uploaded photo (local/URL/Cloudinary)

    skills: [
      {
        category: String, // "Languages", "Frameworks & Libraries", "Tools", "Soft Skills"...
        items: [String],
      },
    ],

    experience: [experienceSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
    education: [educationSchema],
    achievements: [achievementSchema],

    tags: [String], // for landing-page search & filters (skills/tech/year)

    // theme
    theme: {
      templateId: { type: String, default: "aurora" },
      palette: { type: String, default: "default" },
      fontPair: { type: String, default: "default" },
    },

    // publish + moderation
    isPublished: { type: Boolean, default: false }, // owner-controlled visibility
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    }, // admin permits the profile before it can go live on the public landing page
    approvalNote: { type: String, default: "" },
    slug: { type: String, unique: true, sparse: true },

    // audit trail
    sourceResumeFileName: String,

    // analytics
    viewCount: { type: Number, default: 0 },
    clickCounts: {
      github: { type: Number, default: 0 },
      live: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

portfolioSchema.index({ tags: "text", fullName: "text", headline: "text" });

export default mongoose.model("Portfolio", portfolioSchema);
