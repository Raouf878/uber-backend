import express from "express";
import { createServer } from "http";
import HttpProxy from "http-proxy-middleware";
import { createProxyMiddleware } from "http-proxy-middleware";
import mysql from "mysql";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import RestaurantRoutes from './src/routes/restaurants.js';
import connectDB from "./src/config/mongoDb.js";
import bodyParser from "body-parser";


dotenv.config();

const app = express();
const PORT = process.env.PORT_RESTAURANT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
await connectDB().then(() => {
    console.log("✅ MongoDB connected successfully");
}).catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1); // Exit the process if DB connection fails
});

// Health check endpoint

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'restaurant-service',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


app.use('/crameats', RestaurantRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found raouf',
    path: req.originalUrl
  });
});





app.listen(PORT, '0.0.0.0', () => {
  console.log(`restaurant-service running on port ${PORT}`);
});

