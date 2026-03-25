import { z } from 'zod';

export const loginAdminSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const addDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    specialty: z.string().min(1, 'Specialty is required'),
    degree: z.string().min(1, 'Degree is required'),
    experience: z.string().min(1, 'Experience is required'),
    about: z.string().min(1, 'About is required'),
    available: z.boolean().optional(),
    fees: z.union([z.number(), z.string()]).optional(),
    address: z.string().min(1, 'Address is required'),
  }),
});

export const appointmentIdSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1, 'appointmentId is required'),
  }),
});
