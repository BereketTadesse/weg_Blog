
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema= new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
   email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        // This Regex checks for the @ and the .extension
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password:{
        type: String,
        required: true,
        minlength: 8,
    },
    profilePicture:{
        type: String,
        default: "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"
    },
    role:{
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isverified:{
        type: Boolean,
        default: false
    },
    bio:{
        type: String,
        maxlength: 500
    },
    profileDetail: {
        fullName: { type: String, default: "" },
        bio: { type: String, default: "" },
        profilePic: { type: String, default: "default-avatar.png" }, // URL string
        birthDate: { type: Date },
        location: { type: String },
        aboutMe: { type: String, default: "" }
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,


},
{
    timestamps: true
});

userSchema.pre('save' ,async function(){
    try {
        
        if(!this.isModified('password')){
            return ;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
    
    } catch (error) {
    }
     
});

userSchema.methods.comparePassword = async function(password){
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        return false;
    }
};
 userSchema.methods.generateToken = function(){
    try {
        return jwt.sign({id: this._id}, process.env.JWT_SECRET, {expiresIn: "1d"});
    } catch (error) {
        return false;
    }
};

const User = mongoose.model("User", userSchema);

export default User;
