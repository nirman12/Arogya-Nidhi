import { verifyAccessToken } from '../util/token.util.js';
import { sendError } from '../util/response.util.js';
import supabase from '../config/supabase.js';
import repo from '../repository/auth.repository.js';
import jwt from 'jsonwebtoken';

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
    const userId = payload?.userId || payload?.id || payload?.sub || null;
    req.user = { ...payload, userId, id: payload?.id || userId, sub: payload?.sub || userId };
    // If the app JWT doesn't include a role, try to resolve from local users table
    if (!req.user.role) {
      try {
        const id = payload?.userId || payload?.id || payload?.sub || null;
        if (id) {
          const user = await repo.findUserById(id);
          if (user && user.role) {
            req.user.role = user.role;
            req.user.email = req.user.email || user.email;
          }
        }
      } catch (e) {
        // ignore lookup errors and try dtoken fallback below
      }
    }

    // If still missing role, try Supabase token provided in `dtoken` header
    if (!req.user.role && req.headers?.dtoken) {
      try {
        const dbRes = await supabase.auth.getUser(req.headers.dtoken);
        if (!dbRes.error && dbRes.data?.user) {
          req.user.role = dbRes.data.user.user_metadata?.role || req.user.role;
          req.user.email = req.user.email || dbRes.data.user.email;
        }
      } catch (e) {
        // ignore
      }
    }

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
      // If network is unreachable, try decoding the Supabase JWT locally
      try {
        const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);
        if (payload?.sub) {
          const suppliedRole = payload?.user_metadata?.role || payload?.role || 'patient';
          req.user = { userId: payload.sub, id: payload.sub, sub: payload.sub, email: payload.email, role: suppliedRole };
          return next();
        }
      } catch (_) { /* ignore */ }
      return sendError(res, 'Invalid or expired token', 401);
    }

    const sUser = data.user;
    const suppliedRole = sUser.user_metadata?.role || 'patient';
    req.user = { userId: sUser.id, id: sUser.id, sub: sUser.id, email: sUser.email, role: suppliedRole };
    return next();
  } catch (err) {
    // Network unreachable — try decoding Supabase JWT locally
    if (err?.cause?.code === 'ENETUNREACH' || err?.message?.includes('fetch failed')) {
      try {
        const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);
        if (payload?.sub) {
          const suppliedRole = payload?.user_metadata?.role || payload?.role || 'patient';
          req.user = { userId: payload.sub, id: payload.sub, sub: payload.sub, email: payload.email, role: suppliedRole };
          return next();
        }
      } catch (_) { /* ignore */ }
    }
    console.error('Supabase token validation error', err?.message || err);
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
