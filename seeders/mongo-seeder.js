import mongoose from 'mongoose';
import RestaurantInfo from '../Databases/mongo/models/restaurant.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample restaurant location data
const restaurantLocationData = [
  {
    restaurantId: 1, // Pizza Palace
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main Street, New York, NY 10001',
    openingHours: '11:00',
    closingHours: '23:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  {
    restaurantId: 2, // Burger Junction
    latitude: 40.7580,
    longitude: -73.9855,
    address: '456 Broadway, New York, NY 10013',
    openingHours: '07:00',
    closingHours: '22:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  {
    restaurantId: 3, // Sushi World
    latitude: 40.7614,
    longitude: -73.9776,
    address: '789 5th Avenue, New York, NY 10022',
    openingHours: '17:00',
    closingHours: '24:00',
    workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  {
    restaurantId: 4, // Taco Express
    latitude: 40.7505,
    longitude: -73.9934,
    address: '321 West 42nd Street, New York, NY 10036',
    openingHours: '10:00',
    closingHours: '21:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  }
];

async function connectToMongoDB() {
  try {
    const mongoUri = 'mongodb+srv://raouf:Raouf21@cluster0.5cvf6oy.mongodb.net/crameats?retryWrites=true&w=majority&appName=Cluster0';
    
    // Connect with proper timeout and connection options
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log('✅ MongoDB connection verified');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.error('💡 Please check:');
    console.error('   - Your internet connection');
    console.error('   - MongoDB Atlas cluster is running');
    console.error('   - IP address is whitelisted in MongoDB Atlas');
    console.error('   - Username and password are correct');
    process.exit(1);
  }
}

async function clearRestaurantInfo() {
  console.log('🧹 Clearing existing restaurant location data...');
  
  try {
    // Add timeout to the operation
    const result = await RestaurantInfo.deleteMany({}).maxTimeMS(30000);
    console.log(`✅ Deleted ${result.deletedCount} restaurant location records`);
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      console.warn('⚠️ Clear operation timed out, but this might be expected if collection is empty');
      // Don't throw error, continue with seeding
      return;
    }
    console.error('❌ Failed to clear restaurant location data:', error);
    throw error;
  }
}

async function seedRestaurantLocations() {
  console.log('📍 Seeding restaurant locations...');
  
  try {
    for (const locationData of restaurantLocationData) {
      console.log(`   Creating/updating restaurant ${locationData.restaurantId}...`);
      
      // Use upsert to handle potential duplicates with timeout
      await RestaurantInfo.findOneAndUpdate(
        { restaurantId: locationData.restaurantId },
        locationData,
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true,
          maxTimeMS: 10000 // 10 seconds timeout per operation
        }
      );
    }
    
    console.log(`✅ Created/Updated ${restaurantLocationData.length} restaurant locations`);
  } catch (error) {
    console.error('❌ Failed to seed restaurant locations:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🌱 Starting MongoDB seeding...');
    
    await connectToMongoDB();
    
    // Wait a moment for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await clearRestaurantInfo();
    await seedRestaurantLocations();
    
    // Display summary with timeout
    const count = await RestaurantInfo.countDocuments().maxTimeMS(10000);
    console.log(`\n📊 MongoDB Seeding Summary: ${count} restaurant locations created`);
    
    console.log('🎉 MongoDB seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB seeding failed:', error);
    console.error('💡 Troubleshooting tips:');
    console.error('   - Check your internet connection');
    console.error('   - Verify MongoDB Atlas cluster is running');
    console.error('   - Ensure your IP is whitelisted in MongoDB Atlas');
    console.error('   - Try running the seeder again in a few minutes');
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (disconnectError) {
      console.warn('⚠️ Warning: Could not disconnect cleanly from MongoDB');
    }
  }
}

main();
