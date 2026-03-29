import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmails.js";
import { getUploadedFileUrl } from "../config/cloudinary.js";

const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    // Checks if all fields are provided
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Checks if the user with the provided email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Creates a new user
    const user = await User.create({
      username,
      email,
      password,
      role,
      verificationToken,
      verificationTokenExpires: Date.now() + 3600000, // Token expires in 1 hour
    });

    const verificationUrl = `https://weg-blog-nine.vercel.app/verify/${verificationToken}`;
    const emailOptions = {
      email: user.email,
      subject: "Verify your Weg Blog account",
      html: `
        <div style="margin:0;padding:24px;background:#F4F6F8;font-family:Arial,sans-serif;color:#0F172A;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #DDE3EA;border-radius:14px;padding:28px;">
            <p style="margin:0 0 14px;font-size:24px;line-height:1.2;font-weight:700;color:#0F172A;">Weg Blog</p>
            <h1 style="margin:0 0 8px;font-size:26px;line-height:1.25;color:#0F172A;">Welcome to Weg Blog</h1>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#475569;">Hi ${user.username}, your account is almost ready.</p>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#0F172A;">Thanks for joining Weg Blog. Please verify your email to activate your account and start posting.</p>
            <div style="margin:24px 0;">
              <a href="${verificationUrl}" style="display:inline-block;background:#0F8A5F;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">
                Verify Email
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#475569;word-break:break-all;">
              If the button does not work, use this link:
              <a href="${verificationUrl}" style="color:#0F8A5F;">${verificationUrl}</a>
            </p>
            <hr style="border:0;border-top:1px solid #DDE3EA;margin:20px 0;" />
            <p style="margin:0;font-size:13px;color:#475569;">This verification link expires in 1 hour.</p>
          </div>
        </div>
      `,
      text: `Welcome to Weg Blog, ${user.username}.

Please verify your account using this link:
${verificationUrl}

This verification link expires in 1 hour.`,
    };
    // We use await here so we know if the email actually sent
    await sendEmail(emailOptions);
    res
      .status(201)
      .json({ message: "User created successfully", user: { username, email } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      fullError: error,
      message: "Error getting user",
      error,
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isverified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    res.status(200).json({ message: "User verified successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      fullError: error,
      message: "Error getting user",
      error,
    });
  }
};

const loginuser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Checks if all fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Finds the user with the provided email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({
          message: "User with this email does not exist please register first",
        });
    }

    if (!user.isverified) {
      return res.status(400).json({ message: "User not verified" });
    }
    // Compares the provided password with the user's password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = user.generateToken();
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Returns the user if the password is correct
    return res.status(200).json({
      message: "User logged in successfully",
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    // Logs the error if the user is not logged in successfully
    console.error(error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({
          message: "User with this email does not exist please register first",
        });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();
    const resetUrl = `https://weg-blog-nine.vercel.app/reset-password/${resetToken}`;
    const emailOptions = {
      email,
      subject: "Password Reset",
      html: `
        <div style="margin:0;padding:24px;background:#F4F6F8;font-family:Arial,sans-serif;color:#0F172A;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #DDE3EA;border-radius:14px;padding:28px;">
            <p style="margin:0 0 14px;font-size:24px;line-height:1.2;font-weight:700;color:#0F172A;">Weg Blog</p>
            <h1 style="margin:0 0 8px;font-size:26px;line-height:1.25;color:#0F172A;">Reset Your Password</h1>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#475569;">Hi ${user.username}, we received a password reset request.</p>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#0F172A;">Click the button below to set a new password for your Weg Blog account. If you did not request this, you can ignore this email.</p>
            <div style="margin:24px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#0F8A5F;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">
                Reset Password
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#475569;word-break:break-all;">
              If the button does not work, use this link:
              <a href="${resetUrl}" style="color:#0F8A5F;">${resetUrl}</a>
            </p>
            <hr style="border:0;border-top:1px solid #DDE3EA;margin:20px 0;" />
            <p style="margin:0;font-size:13px;color:#475569;">For your security, this reset link expires in 1 hour.</p>
          </div>
        </div>
      `,
      text: `Hello ${user.username},

Use this link to reset your Weg Blog password:
${resetUrl}

If you did not request this, ignore this email.
This reset link expires in 1 hour.`,
    };
    await sendEmail(emailOptions);
    return res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error sending password reset email", error });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error resetting password", error });
  }
};

const updateProfile = async (req, res) => {
  try {
    // 1. Get user ID from the verifyToken middleware
    const userId = req.user.id;

    // 2. Get text fields from req.body
    const { fullName, bio, birthDate, location, aboutMe } = req.body;

    // 3. Check if a file was uploaded to Cloudinary via Multer
    // If yes, use the Cloudinary URL; if no, we don't update the picture
    const profilePicUrl = getUploadedFileUrl(req.file);

    // 4. Build the update object dynamically
    const updateFields = {
      "profileDetail.fullName": fullName,
      "profileDetail.bio": bio,
      "profileDetail.birthDate": birthDate,
      "profileDetail.location": location,
      "profileDetail.aboutMe": aboutMe,
    };

    // Only add profilePic to the update if a new file was actually uploaded
    if (profilePicUrl) {
      updateFields["profileDetail.profilePic"] = profilePicUrl;
    }

    // 5. Update the Database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const logoutuser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({
          message: "User with this email does not exist please register first",
        });
    }
    res.clearCookie("token");
    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error logging out user", error });
  }
};

const getuser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      fullError: error,
      message: "Error getting user",
      error,
    });
  }
};
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params; // The ID of the profile being viewed
    const currentUserId = req.user.id; // The ID of the logged-in user (from JWT middleware)

    // 1. Find the target user
    const targetUser = await User.findById(id)
      .select("username profileDetail followers following createdAt")
      .populate("followers", "username profileDetail.fullName profileDetail.profilePic")
      .populate("following", "username profileDetail.fullName profileDetail.profilePic");

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Get the post count for this user
    const postsCount = await Post.countDocuments({ author: id });

    // 3. Check if the current user is following the target user
    const isFollowing = targetUser.followers.some(
      (follower) => follower._id.toString() === currentUserId
    );

    const followers = targetUser.followers.map((follower) => ({
      _id: follower._id,
      username: follower.username,
      profileDetail: follower.profileDetail,
    }));

    const following = targetUser.following.map((followedUser) => ({
      _id: followedUser._id,
      username: followedUser.username,
      profileDetail: followedUser.profileDetail,
    }));

    // 4. Send back the combined data
    res.json({
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        profileDetail: targetUser.profileDetail,
        followers,
        following,
        createdAt: targetUser.createdAt,
      },
      stats: {
        followersCount: targetUser.followers.length,
        followingCount: targetUser.following.length,
        postsCount: postsCount
      },
      isFollowing: isFollowing
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const followUser = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }
    
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    if (user.following.includes(targetUserId)) {
      return res.status(400).json({ message: "You are already following this user" });
    }
    
    user.following.push(targetUserId);
    targetUser.followers.push(userId);
    await user.save();
    await targetUser.save();
    return res.status(200).json({ message: "User followed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error following user", error , stackTrace: error.stack});  }
};

const unfollowUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }
    
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }
    if (!user.following.includes(targetUserId)) {
      return res.status(400).json({ message: "You are not following this user" });
    }
    
    user.following.pull(targetUserId);
    targetUser.followers.pull(userId);
    await user.save();
    await targetUser.save();
    return res.status(200).json({ message: "User unfollowed successfully" });
    
  } catch (error) {
    return res.status(500).json({ message: "Error unfollowing user", error });
  }
}

// Add the missing closing brace above

const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const user = await User.findById(userId)
      .populate("followers", "username profileDetail.profilePic followers following")
      .select("followers");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const followers = user.followers.map((follower) => {
      const followerObject = follower.toObject();
      return {
        _id: followerObject._id,
        username: followerObject.username,
        profileDetail: followerObject.profileDetail,
        followersCount: followerObject.followersCount,
        followingCount: followerObject.followingCount,
        id: followerObject.id,
      };
    });

    res.status(200).json({ 
      success: true,
      totalFollowers: user.followersCount,
      followers,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error getting followers", error , stackTrace: error.stack});
  }
};
const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const user = await User.findById(userId)
      .populate("following", "username profileDetail.profilePic followers following")
      .select("following");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const following = user.following.map((followedUser) => {
      const followedUserObject = followedUser.toObject();
      return {
        _id: followedUserObject._id,
        username: followedUserObject.username,
        profileDetail: followedUserObject.profileDetail,
        followersCount: followedUserObject.followersCount,
        followingCount: followedUserObject.followingCount,
        id: followedUserObject.id,
      };
    });

    res.status(200).json({ 
      success: true,
      totalFollowing: user.followingCount,
      following,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error getting following",
       error,
       stackTrace: error.stack});
  }
};
export {
  createUser,
  loginuser,
  logoutuser,
  getuser,
  verifyUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserProfile
};
