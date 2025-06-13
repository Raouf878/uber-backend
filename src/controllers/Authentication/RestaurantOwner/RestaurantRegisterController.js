import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';    
import jwt from 'jsonwebtoken';
import prisma from '../../../config/dbConnection.js';
import { generateToken } from '../helper/JWTgenerate.js';
import { Prisma } from '@prisma/client';


export const RegisterRestaurantOwner = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role, restaurantName, restaurantLat, restaurantLong, RestaurantAddress } = req.body;
    console.log(email, password, role, firstName, lastName, restaurantName, RestaurantAddress, restaurantLat, restaurantLong);
    

    // 1. Validate Input
    if (!email || !password || !role || !firstName || !lastName || !restaurantName || !RestaurantAddress || !restaurantLat || !restaurantLong) {
        return res.status(400).json({ success: false, message: 'Please provide email, password, name, role, restaurant name and address.' });
    }


     if (restaurantLat && (isNaN(restaurantLat) || restaurantLat < -90 || restaurantLat > 90)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid latitude. Must be between -90 and 90.' 
        });
    }

    if (restaurantLong && (isNaN(restaurantLong) || restaurantLong < -180 || restaurantLong > 180)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid longitude. Must be between -180 and 180.' 
        });
    }


    const allowedRoles = ['admin', 'restaurantOwner', 'deliveryDriver', 'client'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role specified. Valid roles are: admin, restaurantOwner, deliveryDriver, salesDepartment, client.' });
    }

    try{
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
    const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: passwordHash,
                role,
            },
        });

        // Create restaurant for the new user
        const newRestaurant = await tx.restaurant.create({
            data: {
                userId: newUser.id,
                name: restaurantName,
                address: RestaurantAddress,
                latitude: restaurantLat ? parseFloat(restaurantLat) : null, // Ensure latitude is a number
                longitude: restaurantLong ? parseFloat(restaurantLong) : null, // Ensure longitude is a number

                // Associate the restaurant with the new user
            },
        });

        return { user: newUser, restaurant: newRestaurant };
    }
    );

    const token = generateToken(result.user.id, result.user.email, result.user.role);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
            success: true,
            message: 'Restaurant Owner registered successfully.',
            data: {
                user: {
                    id: result.user.id,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    email: result.user.email,
                    role: result.user.role
                },
                restaurant: {
                    id: result.restaurant.id,
                    name: result.restaurant.name,
                    address: result.restaurant.address,
                    latitude: result.restaurant.latitude,
                    longitude: result.restaurant.longitude
                }
            },
            token
        });
        } catch (error) {

            console.error('Registration error:', error);

        // Handle Prisma-specific errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success: false,
                    message: 'A user with this email already exists.'
                });
            }
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during registration.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
})

export const LoginRestaurantOwner = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    try {
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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during login.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});