import {createUser, loginuser,logoutuser,getuser,verifyUser,forgotPassword,resetPassword,
    updateProfile
} from "../controller/user.controller.js";

import express from "express";
import protect from "../middleware/auth.js";
import  upload  from "../config/cloudinary.js";


const router = express.Router();

router.route("/register").post(createUser);
router.route("/login").post(loginuser);
router.route("/logout").post(logoutuser);
router.route("/me").get(protect,getuser);
router.route("/verify/:verificationToken").get(verifyUser);
router.route("/forgotPassword").post(protect,forgotPassword);
router.route("/resetPassword/:token").post(protect,resetPassword);
router.route("/updateProfile").put(protect,upload.single('profilePic'),updateProfile);



export default router;