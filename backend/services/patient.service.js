import repo from '../repository/patient.repository.js';
import fs from 'fs';
import path from 'path';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notFound(entity = 'Resource') {
  return { status: 404, message: `${entity} not found` };
}

function forbidden() {
  return { status: 403, message: 'Access denied' };
}

async function _requirePatient(userId) {
  const patient = await repo.findPatientByUserId(userId);
  if (!patient) throw notFound('Patient profile');
  return patient;
}

async function _requireReport(reportId, patientId) {
  const report = await repo.findReportById(reportId);
  if (!report) throw notFound('Report');
  if (report.patientId !== patientId) throw forbidden();
  return report;
}

async function _requireContact(contactId, patientId) {
  const contact = await repo.findEmergencyContactById(contactId);
  if (!contact) throw notFound('Emergency contact');
  if (contact.patientId !== patientId) throw forbidden();
  return contact;
}

function _deleteFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {}); // fire-and-forget
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

async function getProfile(userId) {
  const patient = await _requirePatient(userId);
  return patient;
}

async function updateBasicProfile(userId, body) {
  const { name, email, phone, firstName, lastName } = body;

  // Build full name if firstName/lastName provided
  const resolvedName = (firstName && lastName)
    ? `${firstName} ${lastName}`.trim()
    : name;

  const userUpdates = {};
  if (resolvedName) userUpdates.name = resolvedName;
  if (email)        userUpdates.email = email;
  if (phone !== undefined) userUpdates.phone = phone;

  const updatedUser = Object.keys(userUpdates).length
    ? await repo.updateUserProfile(userId, userUpdates)
    : null;

  return updatedUser;
}

async function updateAvatar(userId, file) {
  if (!file) throw { status: 400, message: 'No image file provided' };

  // Remove old avatar if stored locally
  const existing = await repo.findPatientByUserId(userId);
  if (existing?.user?.avatarUrl?.startsWith('uploads/')) {
    _deleteFile(existing.user.avatarUrl);
  }

  const avatarUrl = file.path.replace(/\\/g, '/');
  const updated = await repo.updateUserProfile(userId, { avatarUrl });
  return updated;
}

async function updateHealthInfo(userId, body) {
  await _requirePatient(userId);

  const {
    height, weight, allergies, chronicConditions, currentMedications, medicalHistory,
    bloodGroup, gender, dateOfBirth,
  } = body;

  const data = {};
  if (height !== undefined)             data.height = height ? parseFloat(height) : null;
  if (weight !== undefined)             data.weight = weight ? parseFloat(weight) : null;
  if (allergies !== undefined)          data.allergies = allergies;
  if (chronicConditions !== undefined)  data.chronicConditions = chronicConditions;
  if (currentMedications !== undefined) data.currentMedications = currentMedications;
  if (medicalHistory !== undefined)     data.medicalHistory = medicalHistory;
  if (bloodGroup !== undefined)         data.bloodGroup = bloodGroup;
  if (gender !== undefined)             data.gender = gender;
  if (dateOfBirth !== undefined)        data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

  if (!Object.keys(data).length) throw { status: 400, message: 'No health fields provided' };

  return repo.updatePatientProfile(userId, data);
}

// ─── Emergency Contacts ───────────────────────────────────────────────────────

async function getEmergencyContacts(userId) {
  const patient = await _requirePatient(userId);
  return repo.findEmergencyContactsByPatient(patient.id);
}

async function createEmergencyContact(userId, body) {
  const patient = await _requirePatient(userId);
  const { contactName, relationship, contactPhone, alternatePhone } = body;

  if (!contactName || !relationship || !contactPhone) {
    throw { status: 400, message: 'contactName, relationship, and contactPhone are required' };
  }

  return repo.createEmergencyContact({
    patientId: patient.id,
    contactName,
    relationship,
    contactPhone,
    alternatePhone: alternatePhone || null,
  });
}

async function updateEmergencyContact(userId, contactId, body) {
  const patient = await _requirePatient(userId);
  await _requireContact(contactId, patient.id);

  const { contactName, relationship, contactPhone, alternatePhone } = body;
  const data = {};
  if (contactName !== undefined)    data.contactName = contactName;
  if (relationship !== undefined)   data.relationship = relationship;
  if (contactPhone !== undefined)   data.contactPhone = contactPhone;
  if (alternatePhone !== undefined) data.alternatePhone = alternatePhone;

  if (!Object.keys(data).length) throw { status: 400, message: 'No fields to update' };

  return repo.updateEmergencyContact(contactId, data);
}

async function deleteEmergencyContact(userId, contactId) {
  const patient = await _requirePatient(userId);
  await _requireContact(contactId, patient.id);
  return repo.deleteEmergencyContact(contactId);
}

// ─── Address ──────────────────────────────────────────────────────────────────

async function getAddress(userId) {
  const patient = await _requirePatient(userId);
  return repo.findAddressByPatient(patient.id);
}

async function upsertAddress(userId, body) {
  const patient = await _requirePatient(userId);
  const { streetAddress, city, state, pinCode, country } = body;

  const data = {};
  if (streetAddress !== undefined) data.streetAddress = streetAddress;
  if (city !== undefined)          data.city = city;
  if (state !== undefined)         data.state = state;
  if (pinCode !== undefined)       data.pinCode = pinCode;
  if (country !== undefined)       data.country = country;

  if (!Object.keys(data).length) throw { status: 400, message: 'No address fields provided' };

  return repo.upsertAddress(patient.id, data);
}

// ─── Medical Reports ──────────────────────────────────────────────────────────

async function getReports(userId, query) {
  const patient = await _requirePatient(userId);
  const { category, page, limit } = query;

  if (category && !repo.VALID_CATEGORIES.includes(category)) {
    throw { status: 400, message: `Invalid category. Allowed: ${repo.VALID_CATEGORIES.join(', ')}` };
  }

  return repo.findReportsByPatient(patient.id, {
    category,
    page: page ? parseInt(page) : 1,
    limit: limit ? Math.min(parseInt(limit), 50) : 10,
  });
}

async function uploadReport(userId, file, body) {
  if (!file) throw { status: 400, message: 'No file uploaded' };

  const patient = await _requirePatient(userId);
  const { title, category, notes, reportDate } = body;

  if (!title) throw { status: 400, message: 'title is required' };
  if (!category) throw { status: 400, message: 'category is required' };
  if (!repo.VALID_CATEGORIES.includes(category)) {
    _deleteFile(file.path);
    throw { status: 400, message: `Invalid category. Allowed: ${repo.VALID_CATEGORIES.join(', ')}` };
  }

  return repo.createMedicalReport({
    patientId:  patient.id,
    title,
    category,
    fileUrl:    file.path.replace(/\\/g, '/'),
    fileName:   file.originalname,
    fileSize:   file.size,
    mimeType:   file.mimetype,
    notes:      notes || null,
    reportDate: reportDate ? new Date(reportDate) : null,
  });
}

async function getReportById(userId, reportId) {
  const patient = await _requirePatient(userId);
  return _requireReport(reportId, patient.id);
}

async function updateReport(userId, reportId, body) {
  const patient = await _requirePatient(userId);
  await _requireReport(reportId, patient.id);

  const { title, category, notes, reportDate } = body;
  const data = {};
  if (title !== undefined)      data.title = title;
  if (notes !== undefined)      data.notes = notes;
  if (reportDate !== undefined) data.reportDate = reportDate ? new Date(reportDate) : null;
  if (category !== undefined) {
    if (!repo.VALID_CATEGORIES.includes(category)) {
      throw { status: 400, message: `Invalid category. Allowed: ${repo.VALID_CATEGORIES.join(', ')}` };
    }
    data.category = category;
  }

  if (!Object.keys(data).length) throw { status: 400, message: 'No fields to update' };

  return repo.updateMedicalReport(reportId, data);
}

async function deleteReport(userId, reportId) {
  const patient = await _requirePatient(userId);
  const report = await _requireReport(reportId, patient.id);

  _deleteFile(report.fileUrl);
  return repo.deleteMedicalReport(reportId);
}

async function downloadReport(userId, reportId) {
  const patient = await _requirePatient(userId);
  const report = await _requireReport(reportId, patient.id);

  if (!fs.existsSync(report.fileUrl)) {
    throw { status: 404, message: 'File not found on server' };
  }

  return {
    filePath: path.resolve(report.fileUrl),
    fileName: report.fileName,
    mimeType: report.mimeType || 'application/octet-stream',
  };
}

export default {
  getProfile,
  updateBasicProfile,
  updateAvatar,
  updateHealthInfo,
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getAddress,
  upsertAddress,
  getReports,
  uploadReport,
  getReportById,
  updateReport,
  deleteReport,
  downloadReport,
};