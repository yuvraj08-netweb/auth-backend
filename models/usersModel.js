import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email must be unique"],
    trim: true,
    minLength: [5, "Email must be at least 5 characters long"],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password must be provided"],
    trim: true,
    minLength: [6, "Password must be at least 6 characters long"],
    select: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    select: false,
  },
  verificationCodeValidation: {
    type: String,
    select: false,
  },
  forgotPasswordCode: {
    type: String,
    select: false,
  },
  forgotPasswordCodeValidation: {
    type: Number,
    select: false,
  },
},{
    timestamps: true 
});

export default mongoose.model("User", userSchema);