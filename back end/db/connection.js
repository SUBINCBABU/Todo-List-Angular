import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const DB = () => {
    const uri = process.env.connecconnection_string;
    if (!uri) {
        console.error("❌ MongoDB URI is missing in .env file");
        process.exit(1);
    }

    mongoose.connect(uri)
        .then(() => {
            console.log("✅ Database connected successfully");
        })
        .catch((err) => {
            console.error("❌ Database connection error:", err.message);
            process.exit(1); 
        });
};
