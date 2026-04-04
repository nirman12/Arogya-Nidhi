import { z } from 'zod';

// ─── Profile ──────────────────────────────────────────────────────────────────

export const updateBasicProfileSchema = z.object({
  body: z.object({
    name:      z.string().min(1).max(100).optional(),
    firstName: z.string().min(1).max(50).optional(),
    lastName:  z.string().min(1).max(50).optional(),
    email:     z.string().email().optional(),
    phone:     z.string().max(20).optional().nullable(),
  }).refine(
    (d) => Object.keys(d).length > 0,
    { message: 'At least one field is required' }
  ),
});

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

export const updateHealthInfoSchema = z.object({
  body: z.object({
    height:             z.coerce.number().positive().max(300).optional().nullable(),
    weight:             z.coerce.number().positive().max(500).optional().nullable(),
    allergies:          z.string().max(2000).optional().nullable(),
    chronicConditions:  z.string().max(2000).optional().nullable(),
    currentMedications: z.string().max(2000).optional().nullable(),
    medicalHistory:     z.string().max(5000).optional().nullable(),
    bloodGroup:         z.enum(BLOOD_GROUPS).optional().nullable(),
    gender:             z.enum(GENDERS).optional().nullable(),
    dateOfBirth:        z.string().datetime({ offset: true }).optional().nullable()
                          .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  }),
});

// ─── Emergency Contact ────────────────────────────────────────────────────────

export const createEmergencyContactSchema = z.object({
  body: z.object({
    contactName:    z.string().min(1).max(100),
    relationship:   z.string().min(1).max(50),
    contactPhone:   z.string().min(7).max(20),
    alternatePhone: z.string().max(20).optional().nullable(),
  }),
});

export const updateEmergencyContactSchema = z.object({
  body: z.object({
    contactName:    z.string().min(1).max(100).optional(),
    relationship:   z.string().min(1).max(50).optional(),
    contactPhone:   z.string().min(7).max(20).optional(),
    alternatePhone: z.string().max(20).optional().nullable(),
  }).refine(
    (d) => Object.keys(d).length > 0,
    { message: 'At least one field is required' }
  ),
});

// ─── Address ──────────────────────────────────────────────────────────────────

export const upsertAddressSchema = z.object({
  body: z.object({
    streetAddress: z.string().max(200).optional().nullable(),
    city:          z.string().max(100).optional().nullable(),
    state:         z.string().max(100).optional().nullable(),
    pinCode:       z.string().max(20).optional().nullable(),
    country:       z.string().max(100).optional().nullable(),
  }).refine(
    (d) => Object.keys(d).length > 0,
    { message: 'At least one address field is required' }
  ),
});

// ─── Medical Reports ──────────────────────────────────────────────────────────

const REPORT_CATEGORIES = ['blood_test', 'x_ray', 'mri', 'ct_scan', 'prescription', 'other'];

export const uploadReportSchema = z.object({
  body: z.object({
    title:      z.string().min(1).max(200),
    category:   z.enum(REPORT_CATEGORIES),
    notes:      z.string().max(1000).optional(),
    reportDate: z.string().optional().nullable(),
  }),
});

export const updateReportSchema = z.object({
  body: z.object({
    title:      z.string().min(1).max(200).optional(),
    category:   z.enum(REPORT_CATEGORIES).optional(),
    notes:      z.string().max(1000).optional().nullable(),
    reportDate: z.string().optional().nullable(),
  }).refine(
    (d) => Object.keys(d).length > 0,
    { message: 'At least one field is required' }
  ),
});

export const getReportsQuerySchema = z.object({
  query: z.object({
    category: z.enum(REPORT_CATEGORIES).optional(),
    page:     z.coerce.number().int().positive().optional(),
    limit:    z.coerce.number().int().positive().max(50).optional(),
  }),
});