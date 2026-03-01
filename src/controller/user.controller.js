import User from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmails.js";


const createUser = async(req,res) =>{
    try {
       
        const {username, email, password,role} = req.body;
        // Checks if all fields are provided
        if (!username || !email || !password|| !role) {
            return res.status(400).json({message: "All fields are required"});
        }
        // Checks if the user with the provided email already exists
        const userExists = await User.findOne({email});
        if (userExists) {
            return res.status(400).json({message: "User with this email already exists"});
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Creates a new user
        const user = await User.create({
            username,
            email,
            password,
            role,
            verificationToken,
            verificationTokenExpires: Date.now() + 3600000 // Token expires in 1 hour
        });

        const verificationUrl = `http://localhost:8080/verify/${verificationToken}`
        const emailOptions = {
    email: user.email,
    subject: "Verify your weg Blog Account 🛡️",
    html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #4CAF50;">Hello, ${user.username}!</h2>
            <p>Thank you for joining <strong>weg Blog</strong>. To complete your registration and secure your account, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                   Verify My Email
                </a>
            </div>

            <p style="font-size: 0.9em; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 0.8em; color: #007BFF; word-break: break-all;">${verificationUrl}</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p>Best regards,<br /><strong>The weg Blog Team</strong></p>
        </div>
    `,
    text: `Hello ${user.username}, welcome to weg Blog! Please verify your account by visiting this link: ${verificationUrl}`
};
        // We use await here so we know if the email actually sent
        await sendEmail(emailOptions);
        res.status(201).json({message: "User created successfully", user:{username, email}});
        
    } catch (error) {
        return res.status(500).json({success: false,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      fullError: error,
      message: "Error getting user",
      error});
    
    }


};

const verifyUser = async (req, res) => {
    try {
      const { verificationToken } = req.params; 
      const user = await User.findOne({ verificationToken, verificationTokenExpires: { $gt: Date.now() } });   
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.isverified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();
      res.status(200).json({ message: 'User verified successfully' });
    } catch (error) {
      return res.status(500).json({success: false,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        fullError: error,
        message: "Error getting user",
        error});
      }};
const loginuser = async(req,res) =>{
    try {
        
        const {email, password} = req.body;
 // Checks if all fields are provided
        if (!email || !password) {
            return res.status(400).json({message: "All fields are required"});
        }
        // Finds the user with the provided email
      
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "User with this email does not exist please register first"});
        }

        if(!user.isverified){
            return res.status(400).json({message: "User not verified"});
        }
        // Compares the provided password with the user's password
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid password"});
        }

        const token = user.generateToken();
         res.cookie("token", token, {
            httpOnly: true ,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
        });
        

        // Returns the user if the password is correct
        return res.status(200).json({message: "User logged in successfully", user: { id: user._id, username: user.username, email: user.email ,role: user.role}});
    } catch (error) {
        // Logs the error if the user is not logged in successfully
        console.error(error);      
    }
};

const forgotPassword = async(req,res)=>{
    try {
        const {email} = req.body;
        const user = await User.findOne({email});    
        if(!user){
            return res.status(400).json({message: "User with this email does not exist please register first"});
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
        await user.save();
        const resetUrl = `http://localhost:8080/reset-password/${resetToken}`;
        const emailOptions = {
            email,
            subject: 'Password Reset',
            html: `<p>Hello ${user.username},</p>
            <p>You have requested to reset your password. Please click the following link to reset your password:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>Best regards,<br /><strong>The weg Blog Team</strong></p>`,
            text: `Hello ${user.username},

            You have requested to reset your password. Please click the following link to reset your password:
            
            ${resetUrl}
            
            This link will expire in 1 hour.
            
            Best regards,
            The weg Blog Team`
        };
        await sendEmail(emailOptions);
        return res.status(200).json({message: "Password reset email sent successfully"});
    } catch (error) {
        return res.status(500).json({message: "Error sending password reset email", error});
    }
};

const resetPassword = async(req,res)=>{     
    try {
        const {token} = req.params;
        const {password} = req.body;
        const user = await User.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}});
        if(!user){
            return res.status(400).json({message: "Invalid or expired token"});
        }
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return res.status(200).json({message: "Password reset successfully"});
    } catch (error) {
        return res.status(500).json({message: "Error resetting password", error});
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
        const profilePicUrl = req.file ? req.file.path : undefined;

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
            user: updatedUser
        });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const logoutuser =async(req,res)=>{
    try {
        const {email} = req.body;
        const user = await User.findOne({email});
        if(!user){  
            
            return res.status(400).json({message: "User with this email does not exist please register first"});
        }
        res.clearCookie("token");
        return res.status(200).json({message: "User logged out successfully"});
    } catch (error) {
        return res.status(500).json({message: "Error logging out user", error});
    }
};

const getuser = async(req,res)=>{
    try {
        const user = await User.findById(req.user.id).select('-password');
        if(!user){
            return res.status(400).json({message: "User not found"});
        }
        return res.status(200).json({user});
    } catch (error) {
        return res.status(500).json({success: false,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      fullError: error,
      message: "Error getting user",
      error});
    
    }
}


export  {createUser, loginuser, logoutuser, getuser,verifyUser,forgotPassword,resetPassword,updateProfile}; ;