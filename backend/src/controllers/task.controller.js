import { prisma } from "../config/db.js";
import { logActivity } from "../services/activity.service.js";
import { getIO } from "../sockets/index.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getPagination } from "../utils/pagination.js";
import { serializeTask } from "../utils/serializers.js";

const taskInclude = {
  assignedTo: true,
  createdBy: true,
  project: { include: { admin: true, members: true } }
};

const assertAssignable = (project, userId) => {
  const isAdmin = project.adminId === userId;
  const isMember = project.members.some((member) => member.id === userId);
  if (!isAdmin && !isMember) throw new ApiError(400, "Assigned user must belong to the project");
};

const sortFromQuery = (sort = "createdAt") => {
  const direction = sort.startsWith("-") ? "desc" : "asc";
  const field = sort.replace("-", "");
  return { [field]: direction };
};

export const listTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = { projectId: req.project.id };
  const isProjectAdmin = req.project.adminId === req.user.id;

  if (!isProjectAdmin) {
    where.assignedToId = req.user.id;
  }

  if (req.query.search) {
    where.OR = [
      { title: { contains: req.query.search, mode: "insensitive" } },
      { description: { contains: req.query.search, mode: "insensitive" } }
    ];
  }
  if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;
  if (req.query.assignedTo && isProjectAdmin) where.assignedToId = req.query.assignedTo;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, include: taskInclude, orderBy: sortFromQuery(req.query.sort), skip, take: limit }),
    prisma.task.count({ where })
  ]);

  res.json({ tasks: tasks.map(serializeTask), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const listMyTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = { assignedToId: req.user.id };

  if (req.query.search) {
    where.OR = [
      { title: { contains: req.query.search, mode: "insensitive" } },
      { description: { contains: req.query.search, mode: "insensitive" } }
    ];
  }
  if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, include: taskInclude, orderBy: { dueDate: "asc" }, skip, take: limit }),
    prisma.task.count({ where })
  ]);

  res.json({ tasks: tasks.map(serializeTask), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const createTask = asyncHandler(async (req, res) => {
  assertAssignable(req.project, req.body.assignedTo);

  const task = await prisma.task.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      dueDate: new Date(req.body.dueDate),
      priority: req.body.priority,
      status: req.body.status,
      assignedToId: req.body.assignedTo,
      projectId: req.project.id,
      createdById: req.user.id
    },
    include: taskInclude
  });

  const serialized = serializeTask(task);
  await logActivity({
    type: "task.created",
    message: `${req.user.name} created ${task.title}`,
    actor: req.user.id,
    project: req.project.id,
    task: task.id
  });
  getIO()?.to(`project:${req.project.id}`).emit("task:created", serialized);
  res.status(201).json({ task: serialized });
});

export const updateTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.project.adminId === userId;
  const allowed = {};

  if (isAdmin) {
    ["title", "description", "dueDate", "priority", "status", "assignedTo"].forEach((key) => {
      if (req.body[key] !== undefined) allowed[key] = req.body[key];
    });
  } else {
    if (req.body.status !== undefined) allowed.status = req.body.status;
    if (req.body.priority !== undefined) allowed.priority = req.body.priority;
    if (Object.keys(req.body).some((key) => !["status", "priority"].includes(key))) {
      throw new ApiError(403, "Members can update only status and priority on assigned tasks");
    }
  }

  if (allowed.assignedTo) assertAssignable(req.project, allowed.assignedTo);

  const data = {};
  if (allowed.title !== undefined) data.title = allowed.title;
  if (allowed.description !== undefined) data.description = allowed.description;
  if (allowed.dueDate !== undefined) data.dueDate = new Date(allowed.dueDate);
  if (allowed.priority !== undefined) data.priority = allowed.priority;
  if (allowed.status !== undefined) data.status = allowed.status;
  if (allowed.assignedTo !== undefined) data.assignedToId = allowed.assignedTo;

  const task = await prisma.task.update({ where: { id: req.task.id }, data, include: taskInclude });
  const serialized = serializeTask(task);
  await logActivity({
    type: "task.updated",
    message: `${req.user.name} updated ${task.title}`,
    actor: req.user.id,
    project: req.project.id,
    task: task.id
  });
  getIO()?.to(`project:${req.project.id}`).emit("task:updated", serialized);
  res.json({ task: serialized });
});

export const deleteTask = asyncHandler(async (req, res) => {
  if (req.project.adminId !== req.user.id) {
    throw new ApiError(403, "Only project admins can delete tasks");
  }

  await logActivity({
    type: "task.deleted",
    message: `${req.user.name} deleted ${req.task.title}`,
    actor: req.user.id,
    project: req.project.id,
    task: req.task.id
  });
  await prisma.task.delete({ where: { id: req.task.id } });
  getIO()?.to(`project:${req.project.id}`).emit("task:deleted", { taskId: req.task.id });
  res.status(204).send();
});
