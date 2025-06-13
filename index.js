import express from "express";
import { createServer } from "http";
import HttpProxy from "http-proxy-middleware";
import mysql from "mysql";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import RegisterRoute from "./src/routes/register/RegisterRoute.js";
import helmet from "helmet";
import { on } from "events";
import path from "path";


const app = express();
const port = process.env.port || 3000;



app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(helmet());


const services = {
    auth : process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    payment : process.env.PAYMENT_SERVICE_URL || "http://localhost:3002",
    order : process.env.ORDER_SERVICE_URL || "http://localhost:3003",
    userService : process.env.USER_SERVICE_URL || "http://localhost:3004",
    RestaurantService : process.env.RESTAURANT_SERVICE_URL || "http://localhost:3005",
    DeliveryService : process.env.DELIVERY_SERVICE_URL || "http://localhost:3006",
    LocationService : process.env.LOCATION_SERVICE_URL || "http://localhost:3007",
    NotificationService : process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3008",
    AnalyticsService : process.env.ANALYTICS_SERVICE_URL || "http://localhost:3009",
}


const proxyOptions = {
    changeOrigin : true,
    logLevel : 'debug',
    onError : (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error' });
    },
    onProxyReq: (proxyReq, req, res) => {
        // You can modify the request here if needed
        console.log(`Proxying request to: ${req.url}`);
    },
}




app.use("/register", HttpProxy.createProxyMiddleware({
    target: services.auth,
    ...proxyOptions,
    pathRewrite: {
        '^/register': '/create-account',
    },
}));



app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


app.listen(port,()=>{
    console.log(`server running ${port}`);
});












app.listen(port,()=>{
    console.log(`server running ${port}`);
});



