import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../../config/dbConnection.js';
import { generateToken } from '../helper/JWTgenerate.js';
import { Prisma } from '@prisma/client';



export const RegisterDeliveryDriver = asyncHandler(async (req, res) => {


const { firstName, lastName, email, password, role } = req.body;



if (!email || !password || !role || !firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'Please provide email, password, name, and role.' });

}
    const allowedRoles = ['admin', 'restaurantOwner', 'deliveryDriver', 'client'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role specified. Valid roles are: admin, restaurantOwner, deliveryDriver, client.' });
    }
    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (existingUser){
            return res.status(409).json({success :false, messeage : `User with email ${email} already exists as a ${role}.`});
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: passwordHash,
                role,
            },  
        })
        const token = generateToken(newUser.id, newUser.email, newUser.role)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production
            sameSite: 'Strict', // Adjust based on your needs
            maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000, // Convert days to milliseconds
        });
        res.status(201).json({
            success: true,
            message: 'Delivery driver registered successfully',
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role,
            },
        });

    } catch (error) {
        console.log(`Error in RegisterDeliveryDriver: ${error.message}`);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({ success: false, message: `User with email ${email} already exists.` });
            }
        } else if (error instanceof Prisma.PrismaClientValidationError) {
            return res.status(400).json({ success: false, message: 'Validation error occurred.' });
        }
        res.status(500).json({ success: false, message: 'Internal server error.' });
        
    }


})

export const DeliveryLogin = asyncHandler(async (req, res) => {

    const [email, password]= req.body;
    if (!email || !password){

        return res.status(400).json({success : false, message: ' Please provide email and password.' });
    }

    const user = await prisma.user.findUnique({
        where : {
            email
        }


    })

    if (!user){
        return res.status(404).json({success : false, message: "User not found."});
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

})
