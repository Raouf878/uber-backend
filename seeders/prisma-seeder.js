import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma client with the schema from the parent directory
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Sample data
const userData = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'customer'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'customer'
  },
  {
    firstName: 'Mario',
    lastName: 'Rossi',
    email: 'mario.rossi@example.com',
    password: 'password123',
    role: 'restaurant_owner'
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    password: 'password123',
    role: 'restaurant_owner'
  },
  {
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.wilson@example.com',
    password: 'password123',
    role: 'delivery_driver'
  },
  {
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@example.com',
    password: 'password123',
    role: 'delivery_driver'
  }
];

const restaurantData = [
  {
    name: 'Pizza Palace',
    userId: 3 // Mario Rossi
  },
  {
    name: 'Burger Junction',
    userId: 4 // Sarah Johnson
  },
  {
    name: 'Sushi World',
    userId: 3 // Mario Rossi (can own multiple restaurants)
  },
  {
    name: 'Taco Express',
    userId: 4 // Sarah Johnson
  }
];

const menuData = [
  {
    restaurantId: 1,
    name: 'Main Menu',
    description: 'Our classic pizza selection',
    price: 0.0
  },
  {
    restaurantId: 1,
    name: 'Lunch Special',
    description: 'Quick lunch options',
    price: 0.0
  },
  {
    restaurantId: 2,
    name: 'Burger Menu',
    description: 'Delicious burgers and sides',
    price: 0.0
  },
  {
    restaurantId: 2,
    name: 'Breakfast Menu',
    description: 'Morning favorites',
    price: 0.0
  },
  {
    restaurantId: 3,
    name: 'Sushi Selection',
    description: 'Fresh sushi and sashimi',
    price: 0.0
  },
  {
    restaurantId: 4,
    name: 'Taco Menu',
    description: 'Authentic Mexican tacos',
    price: 0.0
  }
];

const itemsData = [
  // Pizza Palace Items
  {
    itemId: 'pizza-001',
    name: 'Margherita Pizza',
    restaurantId: 1,
    price: 12.99,
    status: 'available',
    imageUrl: 'https://example.com/images/margherita.jpg'
  },
  {
    itemId: 'pizza-002',
    name: 'Pepperoni Pizza',
    restaurantId: 1,
    price: 14.99,
    status: 'available',
    imageUrl: 'https://example.com/images/pepperoni.jpg'
  },
  {
    itemId: 'pizza-003',
    name: 'Veggie Supreme',
    restaurantId: 1,
    price: 16.99,
    status: 'available',
    imageUrl: 'https://example.com/images/veggie.jpg'
  },
  
  // Burger Junction Items
  {
    itemId: 'burger-001',
    name: 'Classic Cheeseburger',
    restaurantId: 2,
    price: 9.99,
    status: 'available',
    imageUrl: 'https://example.com/images/cheeseburger.jpg'
  },
  {
    itemId: 'burger-002',
    name: 'Bacon Deluxe',
    restaurantId: 2,
    price: 11.99,
    status: 'available',
    imageUrl: 'https://example.com/images/bacon-deluxe.jpg'
  },
  {
    itemId: 'burger-003',
    name: 'Veggie Burger',
    restaurantId: 2,
    price: 8.99,
    status: 'available',
    imageUrl: 'https://example.com/images/veggie-burger.jpg'
  },
  {
    itemId: 'side-001',
    name: 'French Fries',
    restaurantId: 2,
    price: 3.99,
    status: 'available',
    imageUrl: 'https://example.com/images/fries.jpg'
  },
  
  // Sushi World Items
  {
    itemId: 'sushi-001',
    name: 'California Roll',
    restaurantId: 3,
    price: 8.99,
    status: 'available',
    imageUrl: 'https://example.com/images/california-roll.jpg'
  },
  {
    itemId: 'sushi-002',
    name: 'Salmon Sashimi',
    restaurantId: 3,
    price: 12.99,
    status: 'available',
    imageUrl: 'https://example.com/images/salmon-sashimi.jpg'
  },
  {
    itemId: 'sushi-003',
    name: 'Dragon Roll',
    restaurantId: 3,
    price: 15.99,
    status: 'available',
    imageUrl: 'https://example.com/images/dragon-roll.jpg'
  },
  
  // Taco Express Items
  {
    itemId: 'taco-001',
    name: 'Chicken Taco',
    restaurantId: 4,
    price: 2.99,
    status: 'available',
    imageUrl: 'https://example.com/images/chicken-taco.jpg'
  },
  {
    itemId: 'taco-002',
    name: 'Beef Taco',
    restaurantId: 4,
    price: 3.49,
    status: 'available',
    imageUrl: 'https://example.com/images/beef-taco.jpg'
  },
  {
    itemId: 'taco-003',
    name: 'Fish Taco',
    restaurantId: 4,
    price: 3.99,
    status: 'available',
    imageUrl: 'https://example.com/images/fish-taco.jpg'
  }
];

// Menu-Item relationships
const menuItemData = [
  // Pizza Palace - Main Menu
  { menuId: 1, itemId: 1 },
  { menuId: 1, itemId: 2 },
  { menuId: 1, itemId: 3 },
  
  // Pizza Palace - Lunch Special
  { menuId: 2, itemId: 1 },
  { menuId: 2, itemId: 2 },
  
  // Burger Junction - Burger Menu
  { menuId: 3, itemId: 4 },
  { menuId: 3, itemId: 5 },
  { menuId: 3, itemId: 6 },
  { menuId: 3, itemId: 7 },
  
  // Burger Junction - Breakfast Menu
  { menuId: 4, itemId: 4 },
  { menuId: 4, itemId: 7 },
  
  // Sushi World - Sushi Selection
  { menuId: 5, itemId: 8 },
  { menuId: 5, itemId: 9 },
  { menuId: 5, itemId: 10 },
  
  // Taco Express - Taco Menu
  { menuId: 6, itemId: 11 },
  { menuId: 6, itemId: 12 },
  { menuId: 6, itemId: 13 }
];

const orderData = [
  {
    userId: 1, // John Doe
    restaurantId: 1, // Pizza Palace
    status: 'delivered',
    timestamp: new Date('2025-06-15T18:30:00'),
    totalPrice: 27.98
  },
  {
    userId: 2, // Jane Smith
    restaurantId: 2, // Burger Junction
    status: 'delivered',
    timestamp: new Date('2025-06-16T12:15:00'),
    totalPrice: 21.98
  },
  {
    userId: 1, // John Doe
    restaurantId: 3, // Sushi World
    status: 'preparing',
    timestamp: new Date('2025-06-18T19:00:00'),
    totalPrice: 24.98
  }
];

const orderItemData = [
  // Order 1: John's pizza order
  { orderId: 1, itemId: 1, quantity: 1 }, // Margherita Pizza
  { orderId: 1, itemId: 2, quantity: 1 }, // Pepperoni Pizza
  
  // Order 2: Jane's burger order
  { orderId: 2, itemId: 4, quantity: 1 }, // Classic Cheeseburger
  { orderId: 2, itemId: 5, quantity: 1 }, // Bacon Deluxe
  
  // Order 3: John's sushi order
  { orderId: 3, itemId: 8, quantity: 1 }, // California Roll
  { orderId: 3, itemId: 10, quantity: 1 } // Dragon Roll
];

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
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
  
  console.log('✅ Database cleared successfully');
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  for (const user of userData) {
    const hashedPassword = await hashPassword(user.password);
    await prisma.user.create({
      data: {
        ...user,
        password: hashedPassword
      }
    });
  }
  
  console.log(`✅ Created ${userData.length} users`);
}

async function seedRestaurants() {
  console.log('🏪 Seeding restaurants...');
  
  for (const restaurant of restaurantData) {
    await prisma.restaurant.create({
      data: restaurant
    });
  }
  
  console.log(`✅ Created ${restaurantData.length} restaurants`);
}

async function seedMenus() {
  console.log('📋 Seeding menus...');
  
  for (const menu of menuData) {
    await prisma.menu.create({
      data: menu
    });
  }
  
  console.log(`✅ Created ${menuData.length} menus`);
}

async function seedItems() {
  console.log('🍕 Seeding items...');
  
  for (const item of itemsData) {
    await prisma.items.create({
      data: item
    });
  }
  
  console.log(`✅ Created ${itemsData.length} items`);
}

async function seedMenuItems() {
  console.log('🔗 Seeding menu-item relationships...');
  
  for (const menuItem of menuItemData) {
    await prisma.menuItem.create({
      data: menuItem
    });
  }
  
  console.log(`✅ Created ${menuItemData.length} menu-item relationships`);
}

async function seedOrders() {
  console.log('📦 Seeding orders...');
  
  for (const order of orderData) {
    await prisma.order.create({
      data: order
    });
  }
  
  console.log(`✅ Created ${orderData.length} orders`);
}

async function seedOrderItems() {
  console.log('🛒 Seeding order items...');
  
  for (const orderItem of orderItemData) {
    await prisma.orderItem.create({
      data: orderItem
    });
  }
  
  console.log(`✅ Created ${orderItemData.length} order items`);
}

async function main() {
  try {
    console.log('🌱 Starting PostgreSQL database seeding...');
    
    await clearDatabase();
    await seedUsers();
    await seedRestaurants();
    await seedMenus();
    await seedItems();
    await seedMenuItems();
    await seedOrders();
    await seedOrderItems();
    
    console.log('🎉 PostgreSQL database seeding completed successfully!');
    
    // Display summary
    const counts = {
      users: await prisma.user.count(),
      restaurants: await prisma.restaurant.count(),
      menus: await prisma.menu.count(),
      items: await prisma.items.count(),
      menuItems: await prisma.menuItem.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count()
    };
    
    console.log('\n📊 PostgreSQL Seeding Summary:');
    console.table(counts);
    
  } catch (error) {
    console.error('❌ PostgreSQL seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
