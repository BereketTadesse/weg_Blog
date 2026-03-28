import protect from "../middleware/auth.js";
import express from 'express';
import {
    createComment,
    editComment,
    deleteComment,
    getcomment,
    getCommentsByPost,
    getRepliesByComment,
    replyToComment,
    editReply,
    deleteReply
} from "../controller/comment.controller.js";

const router = express.Router();    

router.route("/createComment/:postId").post(protect, createComment);
router.route("/editComment/:commentId").put(protect, editComment);
router.route("/deleteComment/:commentId").delete(protect, deleteComment);
router.route("/getcomment/:commentId").get(protect, getcomment);
router.route("/getCommentsByPost/:postId").get(protect, getCommentsByPost);
router.route("/replyToComment/:commentId").post(protect, replyToComment);
router.route("/getRepliesByComment/:commentId").get(protect, getRepliesByComment);
router.route("/editReply/:commentId").put(protect, editReply);
router.route("/deleteReply/:commentId").delete(protect, deleteReply);


export default router;
