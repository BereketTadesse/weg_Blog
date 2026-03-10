import protect from "../middleware/auth.js";
import express from 'express';
import { createComment, editComment, deleteComment, getcomment ,getCommentsByPost} from "../controller/comment.controller.js";

const router = express.Router();    

router.route("/createComment/:postId").post(protect, createComment);
router.route("/editComment/:commentId").put(protect, editComment);
router.route("/deleteComment/:commentId").delete(protect, deleteComment);
router.route("/getcomment/:commentId").get(protect, getcomment);
router.route("/getCommentsByPost/:postId").get(protect, getCommentsByPost);


export default router;
