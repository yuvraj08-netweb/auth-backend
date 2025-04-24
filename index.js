import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRouter from "./routers/authRouter.js";
import postsRouter from "./routers/postsRouter.js";

const app = express();

// middlewares
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);

// default home page
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the AUTH DEMO Server",
    apis: {
      auth: {
        signup: "/api/auth/signup - Register a new user",
        signin: "/api/auth/signin - Login a user",
        signout: "/api/auth/signout - Logout a user",
        sendVerificationCode: "/api/auth/send-verification-code - Send a verification code to verify the user's account",
        verifyVerificationCode: "/api/auth/verify-verification-code - Verify the user's account",
        changePassword: "/api/auth/change-password - Change the user's password",
        sendForgotPasswordCode: "/api/auth/send-forgot-password-code - Send a code to the user's email to reset the password",
        verifyForgotPasswordCode: "/api/auth/verify-forgot-password-code - Verify the code sent to the user's email to reset the password",
      },
      posts: {
        getAllPosts: "/api/posts - Get all posts",
        createPost: "/api/create-post - Create a new post",
        getPostById: "/api/single-post?_id='' - Get a post by ID",
        updatePost: "/api/update-post?_id='' - Update a post by ID",
        deletePost: "/api/delete-post?_id='' - Delete a post by ID",
      },
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
