import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-for-prisma-jwt-at-least-32-chars';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_COOKIE_EXPIRES_IN_DAYS = process.env.JWT_COOKIE_EXPIRES_IN_DAYS || 1;


export const generateToken = (userId, email, role) => {
    return jwt.sign({ id: userId, email, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

// --- Helper to send token in cookie and response ---
export const sendTokenResponse = (user, statusCode, res, message) => {
    const token = generateToken(user.id, user.email, user.role);

    const cookieOptions = {
        expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    };

    const userData = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phoneNumber: user.phoneNumber,
    };
    if (user.role === 'restaurantOwner' && user.restaurantName) {
        userData.restaurantName = user.restaurantName;
    }
    if (user.role === 'deliveryDriver' && user.vehicleDetails) {
        // Assuming vehicleDetails is stored as a JSON string in DB, parse it
        try {
            userData.vehicleDetails = typeof user.vehicleDetails === 'string' ? JSON.parse(user.vehicleDetails) : user.vehicleDetails;
        } catch (e) {
            console.warn("Could not parse vehicleDetails for user:", user.id);
            userData.vehicleDetails = user.vehicleDetails; // send as is or null
        }
    }


    res.status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            message,
            token,
            user: userData,
        });
};
