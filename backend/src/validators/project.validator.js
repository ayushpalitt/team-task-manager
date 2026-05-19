import { z } from "zod";

const id = z.string().min(8, "Invalid id");

export const projectParamsSchema = z.object({
  params: z.object({
    projectId: id
  })
});

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(120),
    description: z.string().max(1000).optional().default(""),
    memberIds: z.array(id).optional().default([])
  })
});

export const updateProjectSchema = z.object({
  params: z.object({
    projectId: id
  }),
  body: z.object({
    title: z.string().min(2).max(120).optional(),
    description: z.string().max(1000).optional()
  })
});

export const memberSchema = z.object({
  params: z.object({
    projectId: id,
    userId: id.optional()
  }),
  body: z
    .object({
      email: z.string().email().optional(),
      userId: id.optional()
    })
    .optional()
    .default({})
});
