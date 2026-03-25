import repo from '../repository/auth.repository.js';
import { hashPassword, comparePassword } from '../util/password.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../util/token.util.js';

const ALLOWED_ROLES = ['patient', 'doctor', 'student', 'admin'];

// ─── Register ─────────────────────────────────────────────────────────────────

async function register(body, meta = {}) {
  const { email, password, role, name, phone, ...profileData } = body;

  if (!ALLOWED_ROLES.includes(role)) {
    throw { status: 400, message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` };
  }

  const existing = await repo.findUserByEmail(email);
  if (existing) throw { status: 409, message: 'Email already in use' };

  const passwordHash = await hashPassword(password);

  const user = await repo.createUser({ email, passwordHash, role, name, phone });

  // Create role-specific profile
  if (role === 'patient') {
    const { dateOfBirth, bloodGroup, gender, address } = profileData;
    await repo.createPatient({ userId: user.id, dateOfBirth, bloodGroup, gender, address });
  } else if (role === 'doctor') {
    const { nmcLicenseNo, specialty, subSpecialty, qualifications, experienceYears, consultationFee, bio } = profileData;
    if (!nmcLicenseNo) throw { status: 400, message: 'nmcLicenseNo is required for doctors' };
    await repo.createDoctorProfile({ userId: user.id, nmcLicenseNo, specialty, subSpecialty, qualifications, experienceYears, consultationFee, bio });
  } else if (role === 'student') {
    const { institution, yearOfStudy, faculty } = profileData;
    await repo.createStudentProfile({ userId: user.id, institution, yearOfStudy, faculty });
  }

  const tokens = await _issueTokens(user, meta);

  return { user: _safeUser(user), ...tokens };
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function login(email, password, meta = {}) {
  const user = await repo.findUserByEmail(email);
  if (!user) throw { status: 401, message: 'Invalid credentials' };

  if (!user.isActive) throw { status: 403, message: 'Account is deactivated' };

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw { status: 401, message: 'Invalid credentials' };

  const tokens = await _issueTokens(user, meta);

  return { user: _safeUser(user), ...tokens };
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

async function refresh(rawToken, meta = {}) {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw { status: 401, message: 'Invalid or expired refresh token' };
  }

  const tokenHash = hashToken(rawToken);
  const storedToken = await repo.findRefreshTokenByHash(tokenHash);

  if (!storedToken || storedToken.isRevoked) {
    throw { status: 401, message: 'Refresh token revoked or not found' };
  }

  if (new Date() > storedToken.expiresAt) {
    throw { status: 401, message: 'Refresh token expired' };
  }

  // Rotate: revoke old, issue new
  await repo.revokeRefreshToken(storedToken.id);
  const tokens = await _issueTokens(storedToken.user, meta);

  return tokens;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logout(rawToken) {
  if (!rawToken) throw { status: 400, message: 'Refresh token required' };

  const tokenHash = hashToken(rawToken);
  const storedToken = await repo.findRefreshTokenByHash(tokenHash);

  if (storedToken) {
    await repo.revokeRefreshToken(storedToken.id);
  }
  // Fail silently if token not found (already revoked or expired)
}

async function logoutAll(userId) {
  await repo.revokeAllUserRefreshTokens(userId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function _issueTokens(user, meta) {
  const payload = { sub: user.id, role: user.role, email: user.email };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await repo.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshTokenExpiry(),
    ipAddress: meta.ip || null,
    userAgent: meta.userAgent || null,
  });

  return { accessToken, refreshToken };
}

function _safeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export default { register, login, refresh, logout, logoutAll };