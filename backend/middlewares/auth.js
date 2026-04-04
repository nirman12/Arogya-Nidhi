import { verifyAccessToken } from '../util/token.util.js';
import { sendError } from '../util/response.util.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization token missing or invalid', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

// middlewares/auth.js — add requireRole alongside your existing authenticate middleware

/**
 * Restricts a route to one or more roles.
 * Usage: requireRole('patient')  or  requireRole('doctor', 'admin')
 *
 * Must be placed AFTER authenticate so req.user is populated.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}
