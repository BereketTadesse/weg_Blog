import express from 'express';
import { createPost ,updatePost, deletePost,
getAllPosts, getPostsByAuthor, toggleLike, incrementShare    
} from '../controller/post.controller.js';
import protect from '../middleware/auth.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.route("/createBlog").post(protect,upload.single('featuredImage'), createPost);
router.route("/updateBlog/:postId").put(protect, upload.single('featuredImage'), updatePost);
router.route("/deleteBlog/:postId").delete(protect, deletePost);
router.route("/getAllBlogs").get(getAllPosts);
router.route("/user/:authorId").get(getPostsByAuthor);
router.route("/toggleLike/:postId").post(protect, toggleLike);

router.route("/incrementShare/:postId").post(protect, incrementShare);

export default router;
