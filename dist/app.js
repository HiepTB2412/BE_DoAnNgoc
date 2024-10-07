import express from 'express';
import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";
import { connectDB } from './utils/features.js';
import { Redis } from 'ioredis';
// importing Routes
import userRoute from "./routes/user.js";
import productRoute from './routes/product.js';
config({
    path: "./.env",
});
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || "";
export const redisTTL = 14400;
connectDB(mongoURI);
export const redis = new Redis({
    host: "redis-17008.c264.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 17008,
    password: "OqW7Anespelcy67WGutUhwNPN4ZLPOrS"
});
redis.on("connect", () => {
    console.log("Redis connected");
});
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});
const app = express();
app.use(express.json());
//using Route
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.listen(port, () => {
    console.log(`Express is working on http://localhost:${port}`);
});
