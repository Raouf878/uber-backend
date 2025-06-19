import express from "express";
import { createServer } from "http";
import HttpProxy from "http-proxy-middleware";
import { createProxyMiddleware } from "http-proxy-middleware";
import mysql from "mysql";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import RegisterRoute from "./src/routes/register/RegisterRoute.js";
import helmet from "helmet";
import { on } from "events";
import connectDB from "./src/config/mongoDb.js";
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;



app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());

// Configure helmet to be less restrictive for development
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

const services = {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001/auth",
    payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:3002",
    orderservice: process.env.ORDER_SERVICE_URL || "http://localhost:3006/orderservice",
    userService: process.env.USER_SERVICE_URL || "http://localhost:3004",
    RestaurantService: process.env.RESTAURANT_SERVICE_URL || "http://localhost:3005/crameats",
    DeliveryService: process.env.DELIVERY_SERVICE_URL || "http://localhost:3006",
    LocationService: process.env.LOCATION_SERVICE_URL || "http://localhost:3007",
    NotificationService: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3008",
    AnalyticsService: process.env.ANALYTICS_SERVICE_URL || "http://localhost:3009",
};

const createSimpleProxy = (target, serviceName) => {
    return createProxyMiddleware({
        target: target,
        changeOrigin: true,
        logLevel: 'debug',
        
        // Add timeout settings
        timeout: 30000, // 30 second timeout
        proxyTimeout: 30000,
        
        // Fix path rewriting
        pathRewrite: (path, req) => {
            // Remove the service name from the path
            const newPath = path.replace(`/${serviceName}`, '');
            console.log(`🔄 Path rewrite: ${path} -> ${newPath || '/'}`);
            console.log(`📦 Request body in pathRewrite:`, req.body);
            return newPath || '/';
        },
        
        onError: (err, req, res) => {
            console.error(`❌ Proxy error for ${serviceName}:`, err.message);
            console.error(`❌ Target: ${target}`);
            console.error(`❌ Original URL: ${req.url}`);
            console.error(`❌ Method: ${req.method}`);
            console.error(`❌ Headers:`, req.headers);
            
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Service temporarily unavailable',
                    service: serviceName,
                    target: target,
                    originalUrl: req.url,
                    method: req.method,
                    timestamp: new Date().toISOString(),
                    details: err.message
                });
            }
        },
        
        onProxyReq: (proxyReq, req, res) => {
            const originalUrl = req.url;
            console.log(`🔄 Proxying: ${req.method} ${originalUrl} -> ${target}${proxyReq.path}`);
            console.log(`📝 Request body in onProxyReq:`, req.body);
            console.log(`📦 Content-Length: ${req.headers['content-length'] || 'Not set'}`);
            console.log(`📋 All headers:`, req.headers);
            
            // Forward authentication headers
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            
            // Add forwarded headers
            proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
            proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
            proxyReq.setHeader('X-Original-URL', originalUrl);
            
            // CRITICAL FIX: Handle request body properly
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                if (req.body && Object.keys(req.body).length > 0) {
                    const bodyData = JSON.stringify(req.body);
                    console.log(`📤 Forwarding body data:`, bodyData);
                    
                    // Remove the original content-length as we're setting a new one
                    proxyReq.removeHeader('content-length');
                    
                    // Set proper headers
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    
                    // Write the body data
                    proxyReq.write(bodyData);
                    proxyReq.end();
                } else {
                    console.log(`📝 No body data to forward`);
                    // For requests without body, make sure to end the request
                    proxyReq.end();
                }
            }
        },
        
        onProxyRes: (proxyRes, req, res) => {
            console.log(`✅ Response from ${serviceName}: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
            
            // Add CORS headers to response
            res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.header('Access-Control-Allow-Credentials', 'true');
        },
        
        // Handle preflight requests
        onProxyReqWs: (proxyReq, req, socket, options, head) => {
            console.log(`🔌 WebSocket proxy request to ${serviceName}`);
        }
    });
};

// Add a middleware to log all requests
app.use((req, res, next) => {
    console.log(`📥 Incoming: ${req.method} ${req.url}`);
    console.log(`📝 Headers:`, req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`📦 Body:`, req.body);
    }
    next();
});

// Setup proxy routes
app.use("/auth", createSimpleProxy(services.auth, 'auth'));
app.use("/payment", createSimpleProxy(services.payment, 'payment'));
app.use("/orderservice", createSimpleProxy(services.orderservice, 'orderservice'));
app.use("/user", createSimpleProxy(services.userService, 'user'));
app.use("/crameats", createSimpleProxy(services.RestaurantService, 'RestaurantService'));
app.use("/delivery", createSimpleProxy(services.DeliveryService, 'delivery'));
app.use("/location", createSimpleProxy(services.LocationService, 'location'));
app.use("/notification", createSimpleProxy(services.NotificationService, 'notification'));
app.use("/analytics", createSimpleProxy(services.AnalyticsService, 'analytics'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        services: services,
        port: port
    });
});

// Test endpoint to verify body parsing
app.post('/test', (req, res) => {
    res.json({
        message: 'Body parsing test',
        receivedBody: req.body,
        headers: req.headers
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Gateway error:', err);
    if (!res.headersSent) {
        res.status(500).json({ 
            error: 'Internal server error',
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }
});



// Single app.listen call
app.listen(port, () => {
    console.log(`🚀 API Gateway running on port ${port}`);
    console.log('📋 Available services:');
    Object.entries(services).forEach(([name, url]) => {
        console.log(`   /${name}/* -> ${url}/*`);
    });
    console.log(`🏥 Health check: http://localhost:${port}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${port}/test`);
});