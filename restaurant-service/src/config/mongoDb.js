import mongoose from 'mongoose';

// Enable debug mode conditionally
if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true);
}

const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB at ${process.env.MONGO_URI}...`);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 15, // Increased pool size
      minPoolSize: 5,
      waitQueueTimeoutMS: 10000,
      maxIdleTimeMS: 30000
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection pool size: ${conn.connection.maxPoolSize}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;