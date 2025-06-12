import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-for-prisma-jwt-at-least-32-chars';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_COOKIE_EXPIRES_IN_DAYS = process.env.JWT_COOKIE_EXPIRES_IN_DAYS || 1;


export const generateToken = (userId, email, role) => {
    return jwt.sign({ id: userId, email, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

