import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "Comment text is required"],
        trim: true,
        maxlength: [500, "Comment cannot be more than 500 characters"]
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Links the comment to the person who wrote it
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post", // Links the comment to the specific blog post
        required: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
        parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    replyCount: {
      type: Number,
      default: 0,
    },

}, { timestamps: true });

// Optional: You can add a virtual to count the likes easily
commentSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;