import { config } from "dotenv";
import mongoose from "mongoose";

config();

const mongoURI = process.env.MONGODB_URI as string;

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

export default connectDB;
