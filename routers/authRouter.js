import express from "express";
import { changePassword, sendForgetPasswordCode, sendVerificationCode, signin, signout, signup, verifyForgetPasswordCode, verifyVerificationCode } from "../controllers/authController.js";
import { identifier } from "../middlewares/identification.js";

const router = express.Router();

router.post("/signup",signup);
router.post("/signin",signin);
router.post("/signout",identifier ,signout);
router.patch("/send-verification-code", identifier, sendVerificationCode);
router.patch("/verify-verification-code", identifier, verifyVerificationCode);
router.patch("/change-password", identifier, changePassword);
router.patch("/send-forgot-password-code", sendForgetPasswordCode);
router.patch("/verify-forgot-password-code", verifyForgetPasswordCode);

export default router;