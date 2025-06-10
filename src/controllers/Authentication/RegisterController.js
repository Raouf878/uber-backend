import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../../config/dbConnection.js';
import express from 'express';
 

const app = express();



exports.register = async (req, res) => {
    try {
        const { email, password, role, name, restaurantName, vehicleDetails, phoneNumber } = req.body;

        // 1. Validate Input
        if (!email || !password || !role || !name || !phoneNumber) {
            return res.status(400).json({ success: false, message: 'Please provide email, password, name, role, and phone number.' });
        }

        const allowedRoles = ['admin', 'restaurantOwner', 'deliveryDriver', 'salesDepartment', 'client'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified. Valid roles are: admin, restaurantOwner, deliveryDriver, salesDepartment, client.' });
        }

        if (role === 'restaurantOwner' && !restaurantName) {
            return res.status(400).json({ success: false, message: 'Restaurant name is required for restaurant owner role.' });
        }
        if (role === 'deliveryDriver' && !vehicleDetails) {
            return res.status(400).json({ success: false, message: 'Vehicle details are required for delivery driver role.' });
        }

        // 2. Check if user already exists with the same email and role
        // Prisma requires a composite key to be defined in the schema for `findUnique` on multiple fields.
        // Alternatively, use `findFirst`.
        const existingUser = await prisma.user.findUnique({
            where: {
                email_role: { // This assumes you've defined @@unique([email, role]) in your schema
                    email: email,
                    role: role,
                }
            }
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: `User with email ${email} already exists as a ${role}.` });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Create New User in Database
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role,
                name,
                phoneNumber,
                restaurantName: role === 'restaurantOwner' ? restaurantName : null,
                // For vehicleDetails, Prisma expects a String if the schema type is String.
                // If it's JSON, ensure vehicleDetails is an object.
                vehicleDetails: role === 'deliveryDriver' ? (typeof vehicleDetails === 'object' ? JSON.stringify(vehicleDetails) : vehicleDetails) : null,
            },
        });

        // 5. Send Token Response
        sendTokenResponse(newUser, 201, res, `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully!`);

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