import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import DeliveryRoutes from './src/routes/deliveries.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT_DELIVERY || 3007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'delivery-service',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  });
});

// Main delivery routes
app.use('/deliveryservice', DeliveryRoutes);

// API info endpoint
app.get('/api/delivery', (req, res) => {
  res.json({
    message: 'delivery-service is running!',
    service: 'delivery-service',
    version: '1.0.0',
    endpoints: {
      deliveries: '/deliveryservice/deliveries',
      availableOrders: '/deliveryservice/orders/available',
      driverDeliveries: '/deliveryservice/drivers/:userId/deliveries',
      stats: '/deliveryservice/stats'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /api/delivery',
      'GET /deliveryservice/deliveries',
      'GET /deliveryservice/orders/available',
      'POST /deliveryservice/orders/:orderId/accept',
      'PUT /deliveryservice/deliveries/:id/status',
      'GET /deliveryservice/stats'
    ]
  });
});

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚚 Delivery service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API info: http://localhost:${PORT}/api/delivery`);
});

export default app;
