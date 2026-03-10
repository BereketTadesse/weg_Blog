import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Post title is required"],
        trim: true,
        maxlength: [100, "Title cannot be more than 100 characters"]
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    content: {
        type: String,
        required: [true, "Post content is required"]
    },
    featuredImage: {
        type: String, 
        default: "https://via.placeholder.com/1200x600?text=No+Image+Provided"
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    category: {
        type: String,
        enum: ["Technology", "Lifestyle", "Business", "Coding", "Other"],
        default: "Other"
    },
    // We store User IDs in these arrays to track WHO liked/disliked
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    dislikes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft"
    },
    views: {
        type: Number,
        default: 0
    },
    shareCount: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true,
    // These two lines are CRUCIAL for showing comments later
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * 1. SLUG GENERATION MIDDLEWARE
 * This runs automatically before the post is validated/saved.
 * It turns "My First Blog!" into "my-first-blog"
 */
postSchema.pre('validate', function(next) {
    if (this.title) {
        this.slug = this.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')     // Remove special characters
            .replace(/[\s_-]+/g, '-')     // Replace spaces/underscores with dashes
            .replace(/^-+|-+$/g, '');     // Remove leading/trailing dashes
    }
    
});

/**
 * 2. VIRTUAL FOR COMMENTS
 * This tells Mongoose: "Go look in the Comment collection 
 * and find every comment where the 'post' ID matches my '_id'."
 */
postSchema.virtual('comments', {
    ref: 'Comment',
    foreignField: 'post',
    localField: '_id'
});

const Post = mongoose.model("Post", postSchema);
export default Post;