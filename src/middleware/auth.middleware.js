import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'No token provided', code: 'AUTH_MISSING_TOKEN' } 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.id, role: decoded.role};
    next();
  } catch (err){
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token', code: 'AUTH_INVALID_TOKEN' }
    });
  }
}