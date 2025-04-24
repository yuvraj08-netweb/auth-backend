import express from "express";
import { createPost, deletePost, getPostById, getPosts, updatePost } from "../controllers/postsController.js";
import { identifier } from "../middlewares/identification.js";

const router = express.Router();

router.get("/all-posts", getPosts);
router.get("/single-post", getPostById);
router.post("/create-post", identifier, createPost);
router.put("/update-post", identifier, updatePost);
router.delete("/delete-post", identifier, deletePost);

export default router;
