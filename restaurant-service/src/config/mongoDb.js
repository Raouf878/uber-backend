import mongoose from 'mongoose';

// Enable debug mode conditionally
if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true);
}

const options = {
  autoIndex: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 10000,
  maxPoolSize: 15,
  minPoolSize: 5,
  waitQueueTimeoutMS: 15000,
  maxIdleTimeMS: 30000,
  heartbeatFrequencyMS: 10000,
  bufferCommands: false, // Disable mongoose buffering
  retryWrites: true,
  w: 'majority'
};

const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB at ${'mongodb+srv://raouf:Raouf21@cluster0.5cvf6oy.mongodb.net/crameats?retryWrites=true&w=majority&appName=Cluster0'}...`);

    // Close existing connections if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Use the options in the connect call
    const conn = await mongoose.connect('mongodb+srv://raouf:Raouf21@cluster0.5cvf6oy.mongodb.net/crameats?retryWrites=true&w=majority&appName=Cluster0', options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection state: ${mongoose.connection.readyState}`);
    console.log(`Database name: ${conn.connection.name}`);
    
    // Test the connection by counting documents in restaurantinfos collection
    try {
      const db = conn.connection.db;
      const count = await db.collection('restaurantinfos').countDocuments();
      console.log(`Total documents in restaurantinfos collection: ${count}`);
      
      // Get a sample document to see the structure
      const sampleDoc = await db.collection('restaurantinfos').findOne();
      console.log('Sample document structure:', sampleDoc ? Object.keys(sampleDoc) : 'No documents found');
    } catch (testError) {
      console.log('Test query failed:', testError.message);
    }

    // Add connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Stack trace:', error.stack);
    
    // Don't exit process in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

export default connectDB;