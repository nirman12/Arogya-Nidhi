import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

// Doctor authentication middleware
const authDoctor = async (req, res, next) => {
  try {
    const { dtoken } = req.headers;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = dtoken || bearerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Token is missing." });
    }

    // First try backend JWT (signed with JWT_SECRET)
    try {
      const token_decode = jwt.verify(token, process.env.JWT_SECRET);
      const userId = token_decode.userId || token_decode.sub || token_decode.id;
      const docId = token_decode.docId || token_decode.doctorId || token_decode.doctor_id || token_decode.id;
      req.user = {
        ...token_decode,
        docId,
        doctorId: docId,
        userId,
        id: userId,
        sub: userId,
      };
      try { console.debug('authDoctor: validated backend JWT', { userId, docId }); } catch(_) {}
      return next();
    } catch (jwtErr) {
      // not a backend JWT — fall through to try Supabase token
    }

    // Fall back: treat dtoken as Supabase access token and validate via Supabase
    if (!supabase) {
      console.log(`[authDoctor] ERROR: supabase is null`);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        console.log(`[authDoctor] ERROR: supabase.auth.getUser failed:`, error?.message || 'No user data');
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
      const sUser = data.user;
      try { console.debug('authDoctor: validated Supabase token', { id: sUser.id, metadata: sUser.user_metadata }); } catch(_) {}
      const { data: doctorProfile, error: doctorProfileError } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', sUser.id)
        .maybeSingle();

      if (doctorProfileError) {
        console.error('[authDoctor] Doctor profile lookup error', doctorProfileError);
        return res.status(500).json({ success: false, message: doctorProfileError.message });
      }

      if (!doctorProfile?.id) {
        return res.status(403).json({ success: false, message: 'Doctor profile not found' });
      }

      req.user = {
        docId: doctorProfile.id,
        doctorId: doctorProfile.id,
        userId: sUser.id,
        id: sUser.id,
        sub: sUser.id,
        role: sUser.user_metadata?.role || 'doctor',
      };
      console.log(`[authDoctor] Success: Authenticated doctor ${doctorProfile.id}`);
      return next();
    } catch (supErr) {
      console.error('[authDoctor] Supabase token validation error', supErr);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('[authDoctor] middleware error', error);
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default authDoctor;
