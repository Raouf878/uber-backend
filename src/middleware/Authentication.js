import jwt from 'jsonwebtoken';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Or import the global instance from your app setup

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-for-prisma-jwt-at-least-32-chars';

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token || token === 'none') {
        return res.status(401).json({ success: false, message: 'Not authorized, no token or token invalid' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            // Select specific fields if needed, Prisma excludes passwordHash by default if not selected
            // select: { id: true, email: true, role: true, name: true, phoneNumber: true, isActive: true, ... }
        });

        if (!currentUser || !currentUser.isActive) { // Also check if user is active
            return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
        }

        if (currentUser.role !== decoded.role) {
             return res.status(401).json({ success: false, message: 'User role has changed, please log in again.' });
        }
        
        // Exclude passwordHash manually if it was fetched somehow, though Prisma usually doesn't return it unless explicitly selected.
        const { passwordHash, ...userWithoutPassword } = currentUser;
        req.user = userWithoutPassword;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Not authorized, token malformed' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Not authorized, token expired' });
        }
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user ? req.user.role : 'unknown'}' is not authorized. Allowed: ${roles.join(', ')}.`
            });
        }
        next();
    };
};