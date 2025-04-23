import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRouter from "./routers/authRouter.js";

const app = express();

// middlewares
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);

// default home page
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the AUTH DEMO Server",
    apis: {
      "/api/auth/signup": "Register a new user",
      "/api/auth/signin": "Login a user",
      "/api/auth/signout": "Logout a user",
      "/api/auth/send-verification-code": "Send a verification code to verify the user's account",
      "/api/auth/verify-verification-code": "Verify the user's account",
      "/api/auth/change-password": "Change the user's password",
      "/api/auth/send-forgot-password-code": "Send a code to the user's email to reset the password",
      "/api/auth/verify-forgot-password-code": "Verify the code sent to the user's email to reset the password",
    },
  });
});

mongoose
  .connect(process.env.MONGO_DB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    // start the server
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
