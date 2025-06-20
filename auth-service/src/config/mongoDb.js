import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB at ${process.env.MONGO_URI}...`);
    
    const conn = await mongoose.connect("mongodb+srv://raouf:Raouf21@cluster0.5cvf6oy.mongodb.net/crameats?retryWrites=true&w=majority&appName=Cluster0");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;