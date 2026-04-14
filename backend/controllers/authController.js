import authService from "../services/auth.service.js";
import { sendSuccess, sendError } from "../util/response.util.js";
import { supabase } from "../config/supabase.js";
import repo from "../repository/auth.repository.js";

function getMeta(req) {
  return {
    ip: req.ip || req.headers["x-forwarded-for"],
    userAgent: req.headers["user-agent"],
  };
}

export async function register(req, res) {
  try {
    const { email, password, name, role, ...profile } = req.body;

    if (!email || !password || !role || !name) {
      return sendError(res, "email, password, name and role are required", 400);
    }

    if (!supabase) {
      return sendError(res, "Supabase not configured on server", 500);
    }

    // Prepare holders for created profiles
    let createdDoctorProfile = null;
    let createdStudentProfile = null;
    let createdPatient = null;

    // Try to create Supabase user via admin API
    try {
      const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, role, ...profile },
        email_confirm: true,
      });
      if (createErr) {
        console.warn("Supabase createUser warning", createErr.message || createErr);
      }
      // Ensure email is marked confirmed; attempt to update if API didn't auto-confirm
      try {
        const uid = createdUser?.id || createdUser?.user?.id;
        if (uid) {
          await supabase.auth.admin.updateUserById(uid, {
            email_confirm: true,
            email_confirmed_at: new Date().toISOString(),
          });
        }
      } catch (updErr) {
        console.warn('Supabase updateUserById warning', updErr?.message || updErr);
      }
    } catch (err) {
      console.warn("Supabase admin.createUser exception", err?.message || err);
    }

    // Sign in to obtain session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return sendSuccess(res, { email }, "User created; please verify email if required", 201);
    }
    // Persist Supabase user metadata into users table (sync role/name)
    try {
      const supaUser = signInData?.user;
      const metadata = supaUser?.user_metadata || {};
      await repo.upsertUser({
        id: supaUser?.id,
        email: supaUser?.email,
        role: metadata.role || role || 'patient',
        name: metadata.name || name || supaUser?.email?.split('@')?.[0] || '',
        avatar_url: metadata.avatar_url || supaUser?.avatar_url || null,
        is_active: true,
      });
      // Create role-specific profile rows (doctor, student, patient)
      const resolvedRole = metadata.role || role || 'patient';

      if (resolvedRole === 'doctor') {
        try {
          const created = await repo.createDoctorProfile({
            user_id: supaUser?.id,
            license_no: profile?.nmcLicenseNo || profile?.licenseNo || null,
            specialty: profile?.specialty || profile?.speciality || null,
            sub_specialty: profile?.subSpecialty || null,
            consultation_fee: profile?.consultation_fee || profile?.consultationFee || 0,
            qualifications: profile?.qualifications || null,
            is_verified: false,
            is_available: profile?.is_available ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          createdDoctorProfile = created || null;
        } catch (profErr) {
          console.warn('Failed to create doctor profile in Supabase', profErr?.message || profErr);
        }
      }

      if (resolvedRole === 'student') {
        try {
          const created = await repo.createStudentProfile({
            user_id: supaUser?.id,
            institution: profile?.institution || profile?.college || null,
            year_of_study: profile?.year_of_study || profile?.year || null,
            faculty: profile?.faculty || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          createdStudentProfile = created || null;
        } catch (profErr) {
          console.warn('Failed to create student profile in Supabase', profErr?.message || profErr);
        }
      }

      if (resolvedRole === 'patient') {
        try {
          const created = await repo.createPatient({
            user_id: supaUser?.id,
            date_of_birth: profile?.date_of_birth || profile?.dob || null,
            blood_group: profile?.blood_group || profile?.bloodGroup || null,
            gender: profile?.gender || null,
            medical_history: profile?.medical_history || profile?.medicalHistory || null,
            allergies: profile?.allergies || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          createdPatient = created || null;
        } catch (profErr) {
          console.warn('Failed to create patient profile in Supabase', profErr?.message || profErr);
        }
      }
    } catch (err) {
      console.warn('Failed to sync Supabase user to users table', err?.message || err);
    }

    const session = signInData?.session || null;
    const responseData = { session, user: signInData.user };
    if (typeof createdDoctorProfile !== 'undefined' && createdDoctorProfile) responseData.doctorProfile = createdDoctorProfile;
    if (typeof createdStudentProfile !== 'undefined' && createdStudentProfile) responseData.studentProfile = createdStudentProfile;
    if (typeof createdPatient !== 'undefined' && createdPatient) responseData.patientProfile = createdPatient;
    return sendSuccess(res, responseData, "Registration successful", 201);
  } catch (err) {
    console.error("Registration error", err);
    return sendError(res, err.message || "Registration failed", err.status || 500);
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    if (!supabase) return sendError(res, "Supabase not configured on server", 500);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return sendError(res, error.message || "Login failed", 401);
    // Sync Supabase metadata into users table (ensure role & name persisted)
    try {
      const supaUser = data?.user;
      const metadata = supaUser?.user_metadata || {};
      await repo.upsertUser({
        id: supaUser?.id,
        email: supaUser?.email,
        role: metadata.role || 'patient',
        name: metadata.name || supaUser?.email?.split('@')?.[0] || '',
        avatar_url: metadata.avatar_url || supaUser?.avatar_url || null,
        is_active: true,
      });
    } catch (err) {
      console.warn('Failed to sync Supabase user to users table on login', err?.message || err);
    }

    return sendSuccess(res, { session: data.session, user: data.user }, "Login successful");
  } catch (err) {
    console.error("Login error", err);
    return sendError(res, err.message || "Login failed", err.status || 500);
  }
}

export async function refreshToken(req, res) {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      return sendError(res, "Refresh token required", 400);
    }

    const tokens = await authService.refresh(token, getMeta(req));
    return sendSuccess(res, tokens, "Token refreshed");
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

export async function logout(req, res) {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    await authService.logout(token);

    return sendSuccess(res, {}, "Logged out successfully");
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

export async function logoutAll(req, res) {
  try {
    await authService.logoutAll(req.user.sub);

    return sendSuccess(res, {}, "Logged out from all devices");
  } catch (err) {
    return sendError(res, err.message, err.status || 500);
  }
}

export async function me(req, res) {
  try {
    const id = req.user?.userId || req.user?.sub || req.user?.id || null;
    if (!id) return sendError(res, 'User id not found in token', 400);

    // Try find local user by id, then by email
    let user = null;
    try {
      user = await repo.findUserById(id);
    } catch (_) {
      // ignore
    }
    if (!user && req.user?.email) {
      try { user = await repo.findUserByEmail(req.user.email); } catch (_) {}
    }

    if (!user) return sendError(res, 'User not found', 404);

    return sendSuccess(res, { user }, 'User profile');
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch user', err.status || 500);
  }
}

export async function getDoctorProfile(req, res) {
  try {
    const id = req.user?.userId || req.user?.sub || req.user?.id || null;
    if (!id) return sendError(res, 'User id not found in token', 400);

    const profile = await repo.findDoctorProfileByUserId(id);
    if (!profile) return sendError(res, 'Doctor profile not found', 404);

    return sendSuccess(res, { profile }, 'Doctor profile');
  } catch (err) {
    console.error('getDoctorProfile error', err);
    return sendError(res, err.message || 'Failed to fetch doctor profile', err.status || 500);
  }
}

export async function updateDoctorProfile(req, res) {
  try {
    const id = req.user?.userId || req.user?.sub || req.user?.id || null;
    if (!id) return sendError(res, 'User id not found in token', 400);

    const body = req.body || {};
    const updates = {};
    if (body.consultation_fee !== undefined) updates.consultation_fee = body.consultation_fee;
    if (body.consultationFee !== undefined) updates.consultation_fee = body.consultationFee;
    if (body.qualifications !== undefined) updates.qualifications = body.qualifications;
    if (body.is_available !== undefined) updates.is_available = body.is_available;
    if (body.isAvailable !== undefined) updates.is_available = body.isAvailable;
    if (body.specialty !== undefined) updates.specialty = body.specialty;
    if (body.sub_specialty !== undefined) updates.sub_specialty = body.sub_specialty;
    if (body.subSpecialty !== undefined) updates.sub_specialty = body.subSpecialty;
    if (body.license_no !== undefined) updates.license_no = body.license_no;
    if (body.nmc_license_no !== undefined) updates.license_no = body.nmc_license_no;

    if (Object.keys(updates).length === 0) return sendError(res, 'No updatable fields provided', 400);

    updates.updated_at = new Date().toISOString();

    const updated = await repo.updateDoctorProfile(id, updates);

    return sendSuccess(res, { profile: updated }, 'Doctor profile updated');
  } catch (err) {
    console.error('updateDoctorProfile error', err);
    return sendError(res, err.message || 'Failed to update doctor profile', err.status || 500);
  }
}