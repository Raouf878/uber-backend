import jwt from 'jsonwebtoken';
import prismaClient from '@prisma/client';
import dotenv from 'dotenv';



const prisma = new prismaClient.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET|| 'your-very-strong-secret-key-for-prisma-jwt-at-least-32-chars';


const authenticateTokenFromCookie = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided, please login.' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
            select :{
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
            }
        });

        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid token, please login again.'
            })
        }
        req.user = {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }
        next();
    } catch (error) {
        if (error.name==='JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token, please login again.' });
        }   
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired, please login again.' });
        }
        console.error('Authentication middleware error:', error);

        return res.status(500).json({ success: false, message: 'Server error during authentication.', error: error.message });
       
        
    }


}

module.exports = {
    authenticateTokenFromCookie,
};