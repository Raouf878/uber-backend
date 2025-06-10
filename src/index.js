import express from "express";
import { createServer } from "http";
import mysql from "mysql";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import dbconnect from "./config/dbConnection.js";

const app = express();
app.useexpress.json();
app.use(cors());
app.use(cookieParser());

app.post("/register", require("./routes/register/RegisterRoute.js"));


app.listen(port,()=>{
    console.log(`server running ${port}`);
});












app.listen(port,()=>{
    console.log(`server running ${port}`);
});



