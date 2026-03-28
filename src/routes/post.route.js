import express from 'express';
import { createPost ,updatePost, deletePost,
getAllPosts, getPostsByAuthor, toggleLike, toggleDislike, incrementShare   ,
getPostBySlug, searchPosts,
getdraftPosts,checkNewPosts
} from '../controller/post.controller.js';
import protect from '../middleware/auth.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.route("/createBlog").post(protect,upload.single('featuredImage'), createPost);
router.route("/updateBlog/:postId").put(protect, upload.single('featuredImage'), updatePost);
router.route("/deleteBlog/:postId").delete(protect, deletePost);
router.route("/getAllBlogs").get(getAllPosts);
router.route("/getdraftBlogs").get(protect, getdraftPosts);
router.route("/getdraftBlogs/:authorId").get(protect, getdraftPosts);
router.route("/user/:authorId").get(getPostsByAuthor);
router.route("/toggleLike/:postId").post(protect, toggleLike);
router.route("/toggleDislike/:postId").post(protect, toggleDislike);
router.route("/incrementShare/:postId").post(protect, incrementShare);
router.route("/getPostBySlug/:slug").get(getPostBySlug);
router.route("/search").get(searchPosts);
router.route("/checkNewPosts").get(protect, checkNewPosts); 

export default router;
