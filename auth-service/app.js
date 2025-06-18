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
import authRoutes from './src/routes/authentication.js';
import connectDB from "./src/config/mongoDb.js";
import env from 'dotenv';
const app = express();
const PORT = 3001;
env.config();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await connectDB().then(() => {
    console.log("✅ MongoDB connected successfully");
}).catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1); // Exit the process if DB connection fails
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'auth-service',
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes

app.use('/auth', authRoutes);

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
    error: 'Route not found raouf',
    path: req.originalUrl
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`auth-service running on port ${PORT}`);
});


