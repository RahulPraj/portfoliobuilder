import mongoose from "mongoose";

const roadmapStepSchema = new mongoose.Schema(
  { title: String, description: String, resources: [String] },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: String,
    content: { type: String, required: true }, // markdown/HTML
    category: { type: String, default: "General" },
    tags: [String],
    coverImage: String,

    isRoadmap: { type: Boolean, default: false },
    roadmapSteps: [roadmapStepSchema],

    isFeatured: { type: Boolean, default: false },
    scheduledFor: Date, // publish scheduling
    isPublished: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Article", articleSchema);
