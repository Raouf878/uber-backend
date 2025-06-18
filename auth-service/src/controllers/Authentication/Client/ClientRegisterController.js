import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../../config/dbConnection.js';
import { generateToken } from '../helper/JWTgenerate.js';
import { Prisma } from '@prisma/client';
import DataAccess from '../../../../data-layer/DataAccess.js';

import express from 'express';
const dataAccess = new DataAccess();
 

export const RegisterClient = async (req, res) => {
    try {
        console.log("laaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaari");
        

        console.log('Received registration request:', req.body);
        const { firstName, lastName, email, password, role } = req.body;

        // 1. Validate Input
        if (!email || !password || !role || !firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'Please provide email, password, name, role, and phone number.' });
        }

        const allowedRoles = ['admin', 'restaurantOwner', 'deliveryDriver', 'salesDepartment', 'client'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified. Valid roles are: admin, restaurantOwner, deliveryDriver, salesDepartment, client.' });
        }


        // 2. Check if user already exists with the same email and role
        // Prisma requires a composite key to be defined in the schema for `findUnique` on multiple fields.
        // Alternatively, use `findFirst`.
        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: `User with email ${email} already exists as a ${role}.` });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Create New User
        const newUser = await dataAccess.RegisterClient(req.body);
        const token = generateToken(newUser.id, newUser.email, newUser.role);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            sameSite: 'Strict', // Adjust based on your needs
            maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000, // Convert days to milliseconds
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                user:newUser, 
                expiresIn : process.env.JWT_EXPIRES_IN || '1h',
                
            },
        });

   
    } catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Unique constraint violation (e.g., P2002)
            if (error.code === 'P2002') {
                // The `error.meta.target` contains the field(s) that violated the constraint
                const target = error.meta?.target;
                return res.status(409).json({ success: false, message: `A user with this ${Array.isArray(target) ? target.join(' and ') : target} already exists.` });
            }
        } else if (error instanceof Prisma.PrismaClientValidationError) {
             return res.status(400).json({ success: false, message: 'Validation error. Please check your input.', details: error.message });
        }
        res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
    }
};

export const LoginClient = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid password.' });
        }

        const token = generateToken(user.id, user.email, user.role);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            sameSite: 'Strict', // Adjust based on your needs
            maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000, // Convert days to milliseconds
        });

        const{password: _, ...userWithoutPassword} = user; // Exclude password from response
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: userWithoutPassword,
                expiresIn: process.env.JWT_EXPIRES_IN || '1h',
            },
        });

        
    } catch (error) { 
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });  
        
    }


    
}

