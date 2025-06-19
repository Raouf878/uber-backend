import jwt from 'jsonwebtoken';

console.log('Auth Service JWT_SECRET from env:', process.env.JWT_SECRET);

const JWT_SECRET = process.env.JWT_SECRET || 'KDKSOQSIJDSOQKDQSKDJZOIDJOZOS_JSJSHG';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_COOKIE_EXPIRES_IN_DAYS = process.env.JWT_COOKIE_EXPIRES_IN_DAYS || 1;

console.log('Using JWT_SECRET for token generation:', JWT_SECRET);

export const generateToken = (userId, email, role) => {
    const payload = { id: userId, email, role };
    console.log('Generating token with payload:', payload);
    const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
    console.log('Generated token:', token);
    return token;
};

