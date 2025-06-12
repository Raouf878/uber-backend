import express from "express";
import { createServer } from "http";
import mysql from "mysql";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import RegisterRoute from "./src/routes/register/RegisterRoute.js";


const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
const port = process.env.port ;
console.log(`port is ${port}`);


app.use("/register", RegisterRoute);


app.listen(port,()=>{
    console.log(`server running ${port}`);
});












app.listen(port,()=>{
    console.log(`server running ${port}`);
});



