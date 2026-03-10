import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";


const createPost = async (req, res) => {
try {
    const { title, content, category } = req.body;
    const authorId = req.user.id; // JWT stores the user id as `id`

    if (!title || !content || !category) {
        return res.status(400).json({ message: "All fields are required" });
    }
    let featuredImageURL = null;
    if (req.file) {
        featuredImageURL = req.file.path; // Assuming you're using Cloudinary
    }
    const post = new Post({
        title,
        content,
        category,
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
        const { title, content, category } = req.body || {};
        const authorId = req.user.id; // JWT stores the user id as `id`

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.author.toString() !== authorId) {
            return res.status(403).json({ message: "You are not authorized to update this post" });
        }
        if (!title && !content && !category && !req.file) {
            return res.status(400).json({ message: "Provide at least one field to update" });
        }
        
        // Update fields if they are provided
        if (title) post.title = title;
        if (content) post.content = content;
        if (category) post.category = category;
        if (req.file) {
            post.featuredImage = req.file.path; // Update featured image if a new one is uploaded
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
        const posts = await Post.find().populate("author", "username profileDetail.profilePic").sort({ createdAt: -1 });
        res.status(200).json({ posts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const getPostsByAuthor = async (req, res) => {
    try {
        // 1. Get the Author ID from the URL params 
        // Example route: /api/posts/user/:authorId
        const { authorId } = req.params;

        // 2. Search for all posts where the 'author' field matches that ID
        const posts = await Post.find({ author: authorId })
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
export { createPost, updatePost, deletePost, getAllPosts, getPostsByAuthor, toggleLike, incrementShare };
