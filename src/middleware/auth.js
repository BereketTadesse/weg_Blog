import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if(!token){
            return res.status(401).json({message: "Unauthorized"});
        }   
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        
        return res.status(401).json({message: "Unauthorized"});
    
    }

};

export default protect;