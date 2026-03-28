import commentModel from "../models/comment.model.js";
import Post from "../models/post.model.js";

const deleteCommentThread = async (commentId) => {
    const idsToDelete = [commentId];
    let cursor = 0;

    while (cursor < idsToDelete.length) {
        const currentId = idsToDelete[cursor];
        const childComments = await commentModel.find({ parentComment: currentId }).select("_id");
        idsToDelete.push(...childComments.map((child) => child._id));
        cursor += 1;
    }

    await commentModel.deleteMany({ _id: { $in: idsToDelete } });
};

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
        const comment = await commentModel
            .findById(commentId)
            .populate("author", "username");
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
        const comments = await commentModel
            .find({ post: postId, parentComment: null })
            .populate("author", "username")
            .sort({ createdAt: -1 });

        const count = await commentModel.countDocuments({ post: postId, parentComment: null });
        res.status(200).json({ comments, count });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Internal server error" });
    }       
};
const getRepliesByComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const parentComment = await commentModel.findById(commentId);
        if (!parentComment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const replies = await commentModel
            .find({ parentComment: commentId })
            .populate("author", "username")
            .sort({ createdAt: 1 });

        res.status(200).json({ replies });
    } catch (error) {
        console.error("Error fetching replies:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const editComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id; // JWT stores the user id as `id`

        if (!content) {
            return res.status(400).json({ message: "Content is required" });
        }

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.author.toString() !== authorId) {
            return res.status(403).json({ message: "Unauthorized to edit this comment" });
        }
        comment.content = content;
        await comment.save();
        const itemType = comment.parentComment ? "Reply" : "Comment";
        res.status(200).json({ message: `${itemType} updated successfully`, comment });
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

        if (comment.parentComment) {
            await commentModel.findByIdAndUpdate(comment.parentComment, {
                $inc: { replyCount: -1 }
            });
        }

        await deleteCommentThread(comment._id);

        const itemType = comment.parentComment ? "Reply" : "Comment";
        res.status(200).json({ message: `${itemType} deleted successfully` });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }    };   

const replyToComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id;
        const parentComment = await commentModel.findById(commentId);
        if (!parentComment) {
            return res.status(404).json({ 
                success: false, 
                message: "Parent comment not found" });
        }

        if (!content) {
            return res.status(400).json({ 
                success: false,
                message: "Content is required" });
        }
        const comment = new commentModel({
            content,
            author: authorId,
            post: parentComment.post,
            parentComment: commentId,
        });  
        await comment.save();
        parentComment.replyCount += 1;
        await parentComment.save();
        res.status(201).json({ message: "Reply created successfully", comment });
    } catch (error) {
        console.error("Error replying to comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }   

        };

const editReply = async (req, res) => {
    try {
        const { commentId } = req.params;
        const reply = await commentModel.findById(commentId);

        if (!reply || !reply.parentComment) {
            return res.status(404).json({ message: "Reply not found" });
        }

        return editComment(req, res);
    } catch (error) {
        console.error("Error editing reply:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteReply = async (req, res) => {
    try {
        const { commentId } = req.params;
        const reply = await commentModel.findById(commentId);

        if (!reply || !reply.parentComment) {
            return res.status(404).json({ message: "Reply not found" });
        }

        return deleteComment(req, res);
    } catch (error) {
        console.error("Error deleting reply:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export {
    createComment,
    getcomment,
    editComment,
    deleteComment,
    getCommentsByPost,
    getRepliesByComment,
    replyToComment,
    editReply,
    deleteReply
};
