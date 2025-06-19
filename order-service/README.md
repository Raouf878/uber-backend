# Order Service

## Overview
The Order Service is a microservice responsible for managing food orders in the CraMeats platform. It handles order creation, status updates, order items management, and provides order analytics.

## Features

### Core Functionality
- **Order Management**: Create, retrieve, update, and cancel orders
- **Order Items**: Add/remove items from orders
- **Order Menus**: Add/remove menus from orders
- **Status Tracking**: Track order status throughout the delivery process
- **User Orders**: Get orders for specific users
- **Restaurant Orders**: Get orders for specific restaurants
- **Order Analytics**: Generate order statistics and reports

### Order Status Flow
```
PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
    ↓         ↓
CANCELLED  CANCELLED
```

## API Endpoints

### Order CRUD Operations
- `POST /crameats/orders` - Create a new order
- `GET /crameats/orders` - Get all orders (admin only)
- `GET /crameats/orders/:id` - Get specific order
- `GET /crameats/orders/:id/details` - Get order with calculated totals
- `PUT /crameats/orders/:id/status` - Update order status
- `PUT /crameats/orders/:id/cancel` - Cancel an order

### User & Restaurant Orders
- `GET /crameats/users/:userId/orders` - Get orders for a user
- `GET /crameats/restaurants/:restaurantId/orders` - Get orders for a restaurant

### Order Items Management
- `POST /crameats/orders/:orderId/items` - Add item to order
- `DELETE /crameats/orders/:orderId/items/:itemId` - Remove item from order

### Analytics
- `GET /crameats/stats/orders` - Get order statistics

### Health Check
- `GET /health` - Service health check
- `GET /crameats/test-db` - Database connection test

## Request/Response Examples

### Create Order
```json
POST /crameats/orders
{
  "userId": 1,
  "restaurantId": 1,
  "totalPrice": 25.99,
  "items": [
    {
      "itemId": 1,
      "quantity": 2
    }
  ],
  "menus": [
    {
      "menuId": 1
    }
  ]
}
```

### Update Order Status
```json
PUT /crameats/orders/1/status
{
  "status": "CONFIRMED"
}
```

## Database Schema Integration

The service integrates with the following Prisma models:
- **Order**: Main order entity
- **OrderItem**: Junction table for order-item relationships
- **OrderMenu**: Junction table for order-menu relationships
- **User**: Customer information
- **Restaurant**: Restaurant information
- **Items**: Food items
- **Menu**: Restaurant menus
- **Delivery**: Delivery information
- **Payment**: Payment information

## Authentication & Authorization

### Authentication
All endpoints (except health checks) require JWT authentication via the `Authorization: Bearer <token>` header.

### Authorization Levels
- **Customer**: Can view and manage their own orders
- **Restaurant Owner**: Can view and manage orders for their restaurants
- **Delivery Driver**: Can update order status during delivery
- **Admin**: Full access to all orders and analytics

## Environment Variables

```bash
PORT_ORDER=3006
DATABASE_URL=postgresql://username:password@localhost:5432/crameats
MONGODB_URI=mongodb://localhost:27017/crameats
JWT_SECRET=your-jwt-secret
NODE_ENV=development
```

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start the service:
```bash
npm run dev
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Architecture

### Layers
1. **Routes**: Handle HTTP requests and responses
2. **Controllers**: Business logic and request validation
3. **Data Access Layer**: Database operations and data management
4. **Database Service**: Abstract interface for data operations
5. **Middleware**: Authentication, validation, and error handling

### Key Components
- **OrderController**: Handles all order-related business logic
- **OrderService**: Data access layer implementation
- **DatabaseService**: Abstract base class for data operations
- **Validation Middleware**: Request/parameter validation using Joi
- **Auth Middleware**: JWT authentication and authorization

## Error Handling

The service implements comprehensive error handling:
- **Validation Errors**: 400 status with detailed field errors
- **Authentication Errors**: 401 status for invalid/missing tokens
- **Authorization Errors**: 403 status for insufficient permissions
- **Not Found Errors**: 404 status for missing resources
- **Database Errors**: Proper handling of Prisma/MongoDB errors
- **Server Errors**: 500 status with sanitized error messages

## Logging

The service logs:
- Route access attempts
- Database operations
- Error occurrences
- Authentication attempts

## Performance Considerations

- **Pagination**: All list endpoints support pagination
- **Database Indexing**: Proper indexes on frequently queried fields
- **Connection Pooling**: Prisma connection pooling for PostgreSQL
- **Caching**: MongoDB connection caching
- **Transaction Support**: Database transactions for complex operations

## Dependencies

### Core Dependencies
- **Express**: Web framework
- **Prisma**: PostgreSQL ORM
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication
- **Joi**: Validation
- **bcrypt**: Password hashing

### Development Dependencies
- **Jest**: Testing framework
- **Supertest**: HTTP testing
- **Nodemon**: Development server

## Contributing

1. Follow the existing code structure and patterns
2. Implement proper error handling
3. Add comprehensive tests for new features
4. Update documentation for API changes
5. Follow the established authentication/authorization patterns

## Deployment

The service can be deployed using:
- Docker (Dockerfile included)
- PM2 for process management
- Environment-specific configuration files
- Database migration scripts

## Monitoring

Monitor the service using:
- Health check endpoint (`/health`)
- Database connection test (`/crameats/test-db`)
- Application logs
- Performance metrics
