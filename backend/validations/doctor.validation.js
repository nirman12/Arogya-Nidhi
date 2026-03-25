import { z } from 'zod';

export const loginDoctorSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const changeAvailabilitySchema = z.object({
  body: z.object({
    docId: z.string().min(1, 'docId is required'),
  }),
});

export const updateDoctorProfileSchema = z.object({
  body: z.object({
    fees: z.number().nonnegative().optional(),
    address: z.string().optional(),
    available: z.boolean().optional(),
  }),
});

export const appointmentIdSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1, 'appointmentId is required'),
  }),
});
