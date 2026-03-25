import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['patient', 'doctor', 'student', 'admin']),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    bloodGroup: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    nmcLicenseNo: z.string().optional(),
    specialty: z.string().optional(),
    subSpecialty: z.string().optional(),
    qualifications: z.string().optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    consultationFee: z.number().nonnegative().optional(),
    bio: z.string().optional(),
    institution: z.string().optional(),
    yearOfStudy: z.number().int().positive().optional(),
    faculty: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});
