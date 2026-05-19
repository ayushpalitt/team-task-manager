import { z } from "zod";

const id = z.string().min(8, "Invalid id");
const priority = z.enum(["low", "medium", "high"]);
const status = z.enum(["todo", "in-progress", "done"]);

export const listTasksSchema = z.object({
  params: z.object({
    projectId: id
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: status.optional(),
    priority: priority.optional(),
    assignedTo: id.optional(),
    sort: z.enum(["dueDate", "-dueDate", "priority", "-priority", "createdAt", "-createdAt"]).optional()
  })
});

export const createTaskSchema = z.object({
  params: z.object({
    projectId: id
  }),
  body: z.object({
    title: z.string().min(2).max(160),
    description: z.string().max(2000).optional().default(""),
    dueDate: z.string().datetime(),
    priority: priority.default("medium"),
    status: status.default("todo"),
    assignedTo: id
  })
});

export const updateTaskSchema = z.object({
  params: z.object({
    taskId: id
  }),
  body: z.object({
    title: z.string().min(2).max(160).optional(),
    description: z.string().max(2000).optional(),
    dueDate: z.string().datetime().optional(),
    priority: priority.optional(),
    status: status.optional(),
    assignedTo: id.optional()
  })
});

export const taskParamsSchema = z.object({
  params: z.object({
    taskId: id
  })
});
