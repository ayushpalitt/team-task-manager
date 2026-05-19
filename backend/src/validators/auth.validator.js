import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().max(160),
    password: z.string().min(8).max(128),
    role: z.enum(["admin", "member"]).default("member")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(160),
    password: z.string().min(8).max(128)
  })
});
