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
    // Try local MongoDB first, then Atlas
    const localUri = 'mongodb://localhost:27017/crameats';
    
    try {
      await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ Connected to Local MongoDB');
      return;
    } catch (localError) {
      console.log('⚠️ Local MongoDB not available, trying Atlas...');
    }
    
    // Fallback to Atlas
    const atlasUri = 'mongodb+srv://raouf:Raouf21@cluster0.5cvf6oy.mongodb.net/crameats?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(atlasUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 15000
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log('✅ MongoDB connection verified');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.error('💡 Please check:');
    console.error('   - Local MongoDB is running, OR');
    console.error('   - Internet connection for Atlas');
    console.error('   - IP address is whitelisted in MongoDB Atlas');
    throw error;
  }
}

async function seedWithoutClear() {
  console.log('📍 Seeding restaurant locations (without clearing)...');
  
  try {
    for (const locationData of restaurantLocationData) {
      console.log(`   Processing restaurant ${locationData.restaurantId}...`);
      
      // Use upsert to handle potential duplicates
      const result = await RestaurantInfo.findOneAndUpdate(
        { restaurantId: locationData.restaurantId },
        locationData,
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );
      
      console.log(`   ✅ Restaurant ${locationData.restaurantId} processed`);
    }
    
    console.log(`✅ Processed ${restaurantLocationData.length} restaurant locations`);
  } catch (error) {
    console.error('❌ Failed to seed restaurant locations:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🌱 Starting MongoDB seeding (local-first)...');
    
    await connectToMongoDB();
    
    // Wait for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Skip clearing and just upsert data
    await seedWithoutClear();
    
    // Display summary
    const count = await RestaurantInfo.countDocuments();
    console.log(`\n📊 MongoDB Seeding Summary: ${count} restaurant locations in database`);
    
    console.log('🎉 MongoDB seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB seeding failed:', error);
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
