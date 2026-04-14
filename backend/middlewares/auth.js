import { verifyAccessToken } from '../util/token.util.js';
import { sendError } from '../util/response.util.js';
import { supabase } from '../config/supabase.js';

// Accepts either the app's JWT or a Supabase access token (Bearer). If Supabase token
// is provided, validates with Supabase and ensures a corresponding local user exists.
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization token missing or invalid', 401);
  }

  const token = authHeader.split(' ')[1];

  // First try existing app access token verification
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    // ignore and try Supabase
  }

  // If supabase client is not configured, reject
  if (!supabase) {
    return sendError(res, 'Invalid or expired token', 401);
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return sendError(res, 'Invalid or expired token', 401);
    }

    const sUser = data.user;

    // Map Supabase user to request user object. No local DB creation.
    const suppliedRole = sUser.user_metadata?.role || 'patient';
    req.user = { sub: sUser.id, email: sUser.email, role: suppliedRole };
    return next();
  } catch (err) {
    console.error('Supabase token validation error', err);
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
