import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB  from "./src/config/DB.js";
import cors from "cors";

import userRoutes from "./src/routes/user.route.js";
dotenv.config({path: "./src/.env"});


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: "http://localhost:3000"
}));
app.use("/api/users", userRoutes);


app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
connectDB();