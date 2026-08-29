import mongoose from "mongoose";
import crypto from "crypto";

const feedbackSchema = new mongoose.Schema(
  {
    portfolio: { type: mongoose.Schema.Types.ObjectId, ref: "Portfolio", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Visitor-supplied, PRIVATE until the owner approves release
    visitorName: { type: String, required: true },
    visitorEmail: { type: String, required: true },
    message: { type: String, required: true },
    requestType: { type: String, enum: ["feedback", "contact"], default: "feedback" },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    decidedAt: Date,

    // Enhancement 4: single-use, time-limited email approval token
    approvalToken: { type: String, select: false },
    approvalTokenExpires: { type: Date, select: false },
    approvalTokenUsed: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

// admin routes never touch this collection's message/visitorEmail fields — that's intentional

feedbackSchema.methods.generateApprovalToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.approvalToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.approvalTokenExpires = Date.now() + 1000 * 60 * 60 * 48; // 48h
  this.approvalTokenUsed = false;
  return rawToken; // raw token goes in the email link; hashed version stored
};

export default mongoose.model("Feedback", feedbackSchema);
