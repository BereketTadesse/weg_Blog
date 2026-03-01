import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/DB.js";
import cors from "cors";

import userRoutes from "./src/routes/user.route.js";
dotenv.config({ path: "./src/.env" });

const app = express();

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = ["http://localhost:8080", "http://127.0.0.1:8080","https://weg-blog-nine.vercel.app"];
app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
  })
);

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
