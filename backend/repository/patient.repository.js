import prisma from '../config/prisma.js';

// ─── Profile ──────────────────────────────────────────────────────────────────

async function findPatientByUserId(userId) {
  return prisma.patient.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
      emergencyContacts: true,
      addressInfo: true,
    },
  });
}

async function findPatientById(id) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
  });
}

// Update user-level fields (name, email, phone, avatarUrl)
async function updateUserProfile(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      updatedAt: true,
    },
  });
}

// Update patient-level fields (dob, bloodGroup, gender, allergies, medicalHistory, height, weight, etc.)
async function updatePatientProfile(userId, data) {
  return prisma.patient.update({
    where: { userId },
    data,
  });
}

// ─── Emergency Contact ────────────────────────────────────────────────────────

async function findEmergencyContactsByPatient(patientId) {
  return prisma.emergencyContact.findMany({
    where: { patientId },
    orderBy: { createdAt: 'asc' },
  });
}

async function findEmergencyContactById(id) {
  return prisma.emergencyContact.findUnique({ where: { id } });
}

async function createEmergencyContact(data) {
  return prisma.emergencyContact.create({ data });
}

async function updateEmergencyContact(id, data) {
  return prisma.emergencyContact.update({ where: { id }, data });
}

async function deleteEmergencyContact(id) {
  return prisma.emergencyContact.delete({ where: { id } });
}

// ─── Patient Address ──────────────────────────────────────────────────────────

async function findAddressByPatient(patientId) {
  return prisma.patientAddress.findUnique({ where: { patientId } });
}

async function upsertAddress(patientId, data) {
  return prisma.patientAddress.upsert({
    where: { patientId },
    create: { patientId, ...data },
    update: data,
  });
}

// ─── Medical Reports ──────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['blood_test', 'x_ray', 'mri', 'ct_scan', 'prescription', 'other'];

async function findReportsByPatient(patientId, { category, page = 1, limit = 10 } = {}) {
  const where = { patientId };
  if (category) where.category = category;

  const [total, reports] = await Promise.all([
    prisma.medicalReport.count({ where }),
    prisma.medicalReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { total, page, limit, reports };
}

async function findReportById(id) {
  return prisma.medicalReport.findUnique({ where: { id } });
}

async function createMedicalReport(data) {
  return prisma.medicalReport.create({ data });
}

async function updateMedicalReport(id, data) {
  return prisma.medicalReport.update({ where: { id }, data });
}

async function deleteMedicalReport(id) {
  return prisma.medicalReport.delete({ where: { id } });
}

export default {
  // profile
  findPatientByUserId,
  findPatientById,
  updateUserProfile,
  updatePatientProfile,
  // emergency contacts
  findEmergencyContactsByPatient,
  findEmergencyContactById,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  // address
  findAddressByPatient,
  upsertAddress,
  // reports
  VALID_CATEGORIES,
  findReportsByPatient,
  findReportById,
  createMedicalReport,
  updateMedicalReport,
  deleteMedicalReport,
};