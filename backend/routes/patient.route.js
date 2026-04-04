import { Router } from 'express';
import * as controller from '../controllers/patient.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { uploadAvatar, uploadReport, handleMulterError } from '../config/multer.config.js';
import {
  updateBasicProfileSchema,
  updateHealthInfoSchema,
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
  upsertAddressSchema,
  uploadReportSchema,
  updateReportSchema,
  getReportsQuerySchema,
} from '../validations/patient.validation.js';

const router = Router();

// All routes require authentication and patient role
router.use(authenticate);
router.use(requireRole('patient'));

// ─── Profile ──────────────────────────────────────────────────────────────────

router.get(
  '/profile',
  controller.getProfile
);

router.patch(
  '/profile',
  validate(updateBasicProfileSchema),
  controller.updateBasicProfile
);

// Avatar upload — multer runs first, then error handler, then controller
router.patch(
  '/profile/avatar',
  (req, res, next) => uploadAvatar(req, res, (err) => err ? handleMulterError(err, req, res, next) : next()),
  controller.updateAvatar
);

router.patch(
  '/profile/health',
  validate(updateHealthInfoSchema),
  controller.updateHealthInfo
);

// ─── Emergency Contacts ───────────────────────────────────────────────────────

router.get(
  '/emergency-contacts',
  controller.getEmergencyContacts
);

router.post(
  '/emergency-contacts',
  validate(createEmergencyContactSchema),
  controller.createEmergencyContact
);

router.patch(
  '/emergency-contacts/:id',
  validate(updateEmergencyContactSchema),
  controller.updateEmergencyContact
);

router.delete(
  '/emergency-contacts/:id',
  controller.deleteEmergencyContact
);

// ─── Address ──────────────────────────────────────────────────────────────────

router.get(
  '/address',
  controller.getAddress
);

// PUT acts as create-or-update (upsert)
router.put(
  '/address',
  validate(upsertAddressSchema),
  controller.upsertAddress
);

// ─── Medical Reports ──────────────────────────────────────────────────────────

router.get(
  '/reports',
  validate(getReportsQuerySchema),
  controller.getReports
);

router.post(
  '/reports',
  (req, res, next) => uploadReport(req, res, (err) => err ? handleMulterError(err, req, res, next) : next()),
  validate(uploadReportSchema),
  controller.uploadReport
);

router.get(
  '/reports/:id',
  controller.getReportById
);

router.patch(
  '/reports/:id',
  validate(updateReportSchema),
  controller.updateReport
);

router.delete(
  '/reports/:id',
  controller.deleteReport
);

router.get(
  '/reports/:id/download',
  controller.downloadReport
);

export default router;