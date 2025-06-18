# Database Seeders

This directory contains comprehensive database seeders for the Uber Backend application.

## Files

- `seed-all.js` - Master seeder that runs both PostgreSQL and MongoDB seeders
- `prisma-seeder.js` - Seeds PostgreSQL database via Prisma
- `mongo-seeder.js` - Seeds MongoDB with restaurant location data
- `clear-databases.js` - Utility to clear all databases
- `package.json` - Dependencies and scripts

## Setup Instructions

### 1. Install Dependencies
```bash
cd seeders
npm install
```

### 2. Generate Prisma Client
Before running the seeders, make sure Prisma client is generated:
```bash
# From the seeders directory
npm run prisma:generate

# OR from the main project directory
cd ..
npx prisma generate
```

### 3. Environment Variables
Make sure your `.env` file in the main project directory contains:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/your_db_name"
MONGODB_URI="mongodb://localhost:27017/crameats"
```

## Usage

### Seed All Databases
```bash
npm run seed
```

### Seed Individual Databases
```bash
# PostgreSQL only
npm run seed:prisma

# MongoDB only
npm run seed:mongo
```

### Clear All Databases
```bash
npm run clear
```

## Sample Data Created

### Users (6 total)
- **Customers**: John Doe, Jane Smith
- **Restaurant Owners**: Mario Rossi, Sarah Johnson
- **Delivery Drivers**: Mike Wilson, Lisa Anderson

### Restaurants (4 total)
1. **Pizza Palace** (Mario Rossi)
   - Location: 123 Main Street, New York
   - Hours: 11:00 - 23:00
   - Items: Margherita Pizza, Pepperoni Pizza, Veggie Supreme

2. **Burger Junction** (Sarah Johnson)
   - Location: 456 Broadway, New York
   - Hours: 07:00 - 22:00
   - Items: Classic Cheeseburger, Bacon Deluxe, Veggie Burger, French Fries

3. **Sushi World** (Mario Rossi)
   - Location: 789 5th Avenue, New York
   - Hours: 17:00 - 24:00
   - Items: California Roll, Salmon Sashimi, Dragon Roll

4. **Taco Express** (Sarah Johnson)
   - Location: 321 West 42nd Street, New York
   - Hours: 10:00 - 21:00
   - Items: Chicken Taco, Beef Taco, Fish Taco

### Additional Data
- **6 Menus** with different categories (Main Menu, Lunch Special, etc.)
- **13 Food Items** with realistic prices and descriptions
- **3 Sample Orders** with different statuses
- **Complete Menu-Item Relationships**
- **Restaurant Location Data** stored in MongoDB

## Troubleshooting

### Prisma Client Error
If you get `@prisma/client did not initialize yet` error:
1. Run `npm run prisma:generate` from the seeders directory
2. Or run `npx prisma generate` from the main project directory
3. Then try running the seeder again

### Duplicate Key Error
If you encounter duplicate key errors:
1. Run `npm run clear` first
2. Then run `npm run seed`

### Connection Errors
- Make sure PostgreSQL is running on your system
- Make sure MongoDB is running on your system
- Verify your environment variables are correct

## Testing

After seeding, you can test your API endpoints:

- `GET /api/restaurants` - View all restaurants
- `GET /api/restaurants/1` - View Pizza Palace details
- `GET /api/users/3/restaurants` - View Mario's restaurants
- `POST /api/auth/login` with email: `john.doe@example.com`, password: `password123`

## Login Credentials

All users have the password: `password123`

**Customers:**
- john.doe@example.com
- jane.smith@example.com

**Restaurant Owners:**
- mario.rossi@example.com
- sarah.johnson@example.com

**Delivery Drivers:**
- mike.wilson@example.com
- lisa.anderson@example.com
