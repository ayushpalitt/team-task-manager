import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    avatarColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional()
  })
});

export const userParamsSchema = z.object({
  params: z.object({
    userId: z.string().min(8, "Invalid id")
  })
});
