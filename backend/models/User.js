import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: function () { return !this.googleId; }, minlength: 8, select: false },
    googleId: { type: String, default: null },
    role: { type: String, enum: ["user"], default: "user" },

    // Admin moderation of the account/profile itself (separate from portfolio publish state)
    accountStatus: {
      type: String,
      enum: ["pending", "approved", "suspended"],
      default: "pending",
    },

    refreshTokenHash: { type: String, select: false },
    isNewAccountNotified: { type: Boolean, default: false }, // admin dashboard "new account" ping
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
