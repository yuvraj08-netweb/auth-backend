import express from "express";
import { sendVerificationCode, signin, signout, signup } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup",signup);
router.post("/signin",signin);
router.post("/signout",signout);
router.patch("/send-verification-code", sendVerificationCode);

export default router;