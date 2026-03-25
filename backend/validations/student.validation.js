import { z } from 'zod';

export const getQuestionsSchema = z.object({
  query: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    year: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    table: z.string().optional(),
  }),
});
