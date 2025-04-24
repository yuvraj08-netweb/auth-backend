import { createPostSchema } from "../middlewares/validator.js";
import Post from "../models/postsModel.js";

export const getPosts = async (req, res) => {
  const { page } = req.query;
  const postsPerPage = 10;
  try {
    let pageNum = 0;
    if (page <= 1) {
      pageNum = 0;
    } else {
      pageNum = page - 1;
    }
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(pageNum * postsPerPage)
      .limit(postsPerPage)
      .populate({
        path: "userId",
        select: ["email"],
      });

    const totalPosts = await Post.countDocuments();

    return res.status(200).json({
      message: "Posts fetched successfully",
      data: posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / postsPerPage),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const createPost = async (req, res) => {
  const { title, description } = req.body;
  const { userId } = req.user;
  try {
    const { error, value } = createPostSchema.validate({
      title,
      description,
      userId,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const post = await Post.create({
      title,
      description,
      userId,
    });

    return res.status(201).json({
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getPostById = async (req, res) => {
  const { _id } = req.params;
  try {
    const post = await Post.findOne(_id).populate({
      path: "userId",
      select: ["email"],
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updatePost = async (req, res) => {
  const { _id } = req.params;
  const { title, description } = req.body;
  const { userId } = req.user;

  try {
    const { error, value } = createPostSchema.validate({
      title,
      description,
      userId,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const post = await Post.findOne(_id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.userId.toString() !== userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    post.title = title;
    post.description = description;

    const result = await post.save();
    if (!result) {
      return res.status(500).json({
        message: "Post not updated",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  const { _id } = req.params;
  const { userId } = req.user;
  try {
    const post = await Post.findOne(_id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.userId.toString() !== userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    const result = await post.deleteOne(_id);

    if (!result) {
      return res.status(500).json({
        message: "Post not deleted",
      });
    }
    
    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
