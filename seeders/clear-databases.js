import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import RestaurantInfo from '../Databases/mongo/models/restaurant.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function clearPostgreSQL() {
  console.log('🧹 Clearing PostgreSQL database...');
  
  try {
    // Delete in correct order to avoid foreign key constraints
    await prisma.orderItem.deleteMany();
    await prisma.orderMenu.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.order.deleteMany();
    await prisma.items.deleteMany();
    await prisma.menu.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ PostgreSQL database cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear PostgreSQL:', error);
    throw error;
  }
}

async function clearMongoDB() {
  console.log('🧹 Clearing MongoDB database...');
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crameats';
    await mongoose.connect(mongoUri);
    
    const result = await RestaurantInfo.deleteMany({});
    console.log(`✅ MongoDB cleared: ${result.deletedCount} documents deleted`);
    
  } catch (error) {
    console.error('❌ Failed to clear MongoDB:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  try {
    console.log('🗑️ Starting database cleanup...');
    console.log('=' .repeat(40));
    
    await clearPostgreSQL();
    await clearMongoDB();
    
    console.log('\n🎉 All databases cleared successfully!');
    console.log('💡 Run "npm run seed" to populate with fresh data');
    
  } catch (error) {
    console.error('\n❌ Database cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
