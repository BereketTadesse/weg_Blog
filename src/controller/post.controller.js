import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import mongoose from "mongoose";
import { getUploadedFileUrl } from "../config/cloudinary.js";


const createPost = async (req, res) => {
try {
    const { title, content, category, status } = req.body;
    const authorId = req.user.id; // JWT stores the user id as `id`

    if (!title || !content || !category|| !status) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const featuredImageURL = getUploadedFileUrl(req.file);
    const post = new Post({
        title,
        content,
        category,
        status,
        author: authorId,
        featuredImage: featuredImageURL || undefined
    });

    await post.save();
    res.status(201).json({ message: "Post created successfully", post });

} catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Internal server error" });
}
};

const updatePost= async(req,res) =>{
    try {
        const { postId } = req.params;
        const { title, content, category,status} = req.body || {};
        const authorId = req.user.id; // JWT stores the user id as `id`

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.author.toString() !== authorId) {
            return res.status(403).json({ message: "You are not authorized to update this post" });
        }
        if (!title && !content && !category && !status && !req.file) {
            return res.status(400).json({ message: "Provide at least one field to update" });
        }
        
        // Update fields if they are provided
        if (title) post.title = title;
        if (content) post.content = content;
        if (category) post.category = category;
        if (status) post.status = status;
        const featuredImageURL = getUploadedFileUrl(req.file);
        if (featuredImageURL) {
            post.featuredImage = featuredImageURL;
        }
        
        await post.save();
        res.status(200).json({ message: "Post updated successfully", post });
        
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}; 

const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const authorId = req.user.id; // JWT stores the user id as `id`
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.author.toString() !== authorId) {
            return res.status(403).json({ message: "You are not authorized to delete this post" });
        }
        await post.deleteOne();
        // Also delete all comments associated with this post
        await Comment.deleteMany({ post: postId });
        res.status(200).json({ message: "Post and associated comments deleted successfully" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10; // Default to 10 posts per page
        const after = req.query.after; // ID of the last post from the previous page
        let query = { status: "published" }; // Only fetch published posts
        if (after) {
            query._id = { $lt: after }; // Fetch posts with IDs less than the 'after' ID
        }
        const posts = await Post.find(query)
            .populate("author", "username profileDetail.profilePic")
            .sort({ createdAt: -1 }) // Show newest posts first
            .limit(limit);

        const lastpost = posts.length > 0 ? posts[posts.length - 1] : null;
        const totalPosts = await Post.countDocuments(query); // Get the most recent post
        
      res.status(200).json({
      success: true,
      data: posts,
      nextcursor: lastpost ? lastpost._id : null, // Send the ID of the last post for pagination
      hasnextpage: lastpost ? totalPosts > limit : false // Indicate if there are more posts to fetch
    });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getdraftPosts = async (req, res) => {
    try {
        const authorId = req.params.authorId || req.user.id; // Use route authorId when provided, otherwise fall back to the logged-in user
        const posts = await Post.find({ author: authorId, status: "draft" })
            .populate("author", "username profileDetail.profilePic")
            .sort({ createdAt: -1 }); // Show newest posts first

        res.status(200).json({ 
            success: true, 
            count: posts.length, 
            posts 
        });

    } catch (error) {
        console.error("Error fetching draft posts:", error);
        res.status(500).json({ message: "Internal server error" });
    };
}
const getPostsByAuthor = async (req, res) => {
    try {
        // 1. Get the Author ID from the URL params 
        // Example route: /api/posts/user/:authorId
        const { authorId } = req.params;

        // 2. Search for all posts where the 'author' field matches that ID
        const posts = await Post.find({ author: authorId ,status: "published"})
            .populate("author", "username profileDetail.profilePic")
            .sort({ createdAt: -1 }); // Show newest posts first

        // 3. Check if we found anything
        if (!posts || posts.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: "This user hasn't posted anything yet.",
                posts: [] 
            });
        }

        res.status(200).json({ 
            success: true, 
            count: posts.length, 
            posts 
        });

    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const getPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await Post.findOne({ slug }).populate("author", "username profileDetail.profilePic");
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json({ post });
    } catch (error) {
        console.error("Error fetching post by slug:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};  
const toggleLike = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

       const isliked = post.likes.includes(userId);
       if (isliked) {
        // If already liked, remove the like
        post.likes.pull(userId);
       } 
         else { 
            post.likes.push(userId);
            post.dislikes.pull(userId);
         }
        await post.save();
        res.status(200).json({ 
            message: isliked ? "Like removed" : "Post liked",
            likesCount: post.likes.length,
            dislikesCount: post.dislikes.length
        });
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const toggleDislike = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

       const isDisliked = post.dislikes.includes(userId);
       if (isDisliked) {
        // If already disliked, remove the dislike
        post.dislikes.pull(userId);
       }
            else {  
            post.dislikes.push(userId);
            post.likes.pull(userId);
         }
        await post.save();
        res.status(200).json({ 
            message: isDisliked ? "Dislike removed" : "Post disliked",
            dislikesCount: post.dislikes.length
        });
    } catch (error) {
        console.error("Error toggling dislike:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}  ;
const incrementShare = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findByIdAndUpdate(
            postId, 
            { $inc: { shareCount: 1 } }, // Increases count by 1
            { new: true }
        );
        res.status(200).json({ success: true, shares: post.shareCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) return res.status(400).json({ message: "Search query is required" });

    // 'i' makes it case-insensitive
    // This will match "cod" inside "coding", "Coder", "encoding", etc.
    const searchRegex = new RegExp(q, 'i');

    const posts = await Post.find({
      status: 'published',
      $or: [
        { title: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
        { category: { $regex: searchRegex } }
      ]
    })
    .populate('author', 'username profileImage')
    .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      count: posts.length,
      results: posts
    });
  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message });
  }
};
const checkNewPosts = async (req, res) => {
    try {
        const { latestid } = req.query;

        if (!latestid) {
           return res.status(400).json({
            message: "Missing latestid query parameter",
            error: "Please provide the latest post ID, for example: /api/posts/checkNewPosts?latestid=<postId>"
           });
        }

        if (!mongoose.Types.ObjectId.isValid(latestid)) {
            return res.status(400).json({
                message: "Invalid latestid",
                error: "The latestid value must be a valid MongoDB ObjectId."
            });
        }

        // Count only published posts that are newer than the provided post ID.
        const newCount = await Post.countDocuments({
            _id: { $gt: latestid },
            status: "published"
        });

        res.status(200).json({
            success: true,
            newPostsCount: newCount,
            hasUpdates: newCount > 0
        });
    } catch (error) {
        console.error("Error checking for new posts:", error);
        res.status(500).json({
            message: "Failed to check for new posts",
            error: "Something went wrong while comparing your latest post ID with published posts."
        });
    }
};
export { createPost, updatePost, deletePost, getAllPosts, getPostsByAuthor, toggleLike, incrementShare ,
    getPostBySlug,
    searchPosts,
    getdraftPosts,
    checkNewPosts,
    toggleDislike
        
};
