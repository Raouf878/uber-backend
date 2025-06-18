import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌱 Starting comprehensive database seeding...');
console.log('=' .repeat(50));

async function runSeeder(seederName, seederPath) {
  try {
    console.log(`\n🔄 Running ${seederName}...`);
    console.log('-'.repeat(30));
    
    // Run the seeder
    execSync(`node ${seederPath}`, { 
      stdio: 'inherit',
      cwd: path.dirname(seederPath)
    });
    
    console.log(`✅ ${seederName} completed successfully!`);
    
  } catch (error) {
    console.error(`❌ ${seederName} failed:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    // Run PostgreSQL seeder first
    await runSeeder(
      'PostgreSQL Seeder',
      path.join(__dirname, 'prisma-seeder.js')
    );
    
    // Wait a bit between seeders
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run MongoDB seeder
    await runSeeder(
      'MongoDB Seeder',
      path.join(__dirname, 'mongo-seeder.js')
    );
    
    console.log('\n🎉 All database seeding completed successfully!');
    console.log('=' .repeat(50));
    console.log('📚 Your database is now populated with sample data:');
    console.log('  • 6 Users (customers, restaurant owners, delivery drivers)');
    console.log('  • 4 Restaurants with location data');
    console.log('  • 6 Menus with various categories');
    console.log('  • 13 Food items across different restaurants');
    console.log('  • 3 Sample orders with order items');
    console.log('  • Complete menu-item relationships');
    console.log('\n💡 You can now test your API endpoints with this data!');
    
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error.message);
    process.exit(1);
  }
}

main();
