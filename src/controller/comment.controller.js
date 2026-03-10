import commentModel from "../models/comment.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

const createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const {postId} = req.params;
        const authorId = req.user.id; // JWT stores the user id as `id`
            if(!content){
                return res.status(400).json({message: "Content is required"});
            }
            const post = await Post.findById(postId);
            if(!post){
                return res.status(404).json({message: "Post not found"});
            }
            const comment = new commentModel({
                content,
                author: authorId,
                post: postId
            });
            await comment.save();
            res.status(201).json({ message: "Comment created successfully", comment });
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getcomment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        res.status(200).json({ comment });
        
    } catch (error) {
        console.error("Error fetching comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }   
        const comments = await commentModel.find({ post: postId }).populate("author", "username");
        res.status(200).json({ comments });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Internal server error" });
    }       
};
const editComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id; // JWT stores the user id as `id`
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.author.toString() !== authorId) {
            return res.status(403).json({ message: "Unauthorized to edit this comment" });
        }
        comment.content = content;
        await comment.save();
        res.status(200).json({ message: "Comment updated successfully", comment });
    } catch (error) {
        console.error("Error editing comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const authorId = req.user.id; // JWT stores the user id as `id`
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }   
        if (comment.author.toString() !== authorId) {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }
        await comment.deleteOne();
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }    };   
export { createComment, getcomment, editComment, deleteComment ,getCommentsByPost};
