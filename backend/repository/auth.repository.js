import prisma from '../config/prisma.js';

// ─── User ────────────────────────────────────────────────────────────────────

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function createUser(data) {
  return prisma.user.create({ data });
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

async function createPatient(data) {
  return prisma.patient.create({ data });
}

async function createDoctorProfile(data) {
  return prisma.doctorProfile.create({ data });
}

async function createStudentProfile(data) {
  return prisma.studentProfile.create({ data });
}

// ─── Refresh Tokens ───────────────────────────────────────────────────────────

async function createRefreshToken(data) {
  return prisma.refreshToken.create({ data });
}

async function findRefreshTokenByHash(tokenHash) {
  return prisma.refreshToken.findFirst({
    where: { tokenHash, isRevoked: false },
    include: { user: true },
  });
}

async function revokeRefreshToken(id) {
  return prisma.refreshToken.update({
    where: { id },
    data: { isRevoked: true },
  });
}

async function revokeAllUserRefreshTokens(userId) {
  return prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

export default {
  findUserByEmail,
  findUserById,
  createUser,
  createPatient,
  createDoctorProfile,
  createStudentProfile,
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
};