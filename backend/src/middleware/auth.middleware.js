import { prisma } from "../config/db.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.token;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ApiError(401, "Invalid token");
    req.user = user;
    next();
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired token");
  }
});

export const loadProject = asyncHandler(async (req, _res, next) => {
  const projectId = req.params.projectId || req.body.project;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { admin: true, members: true }
  });
  if (!project) throw new ApiError(404, "Project not found");
  req.project = project;
  next();
});

export const requireProjectMember = (req, _res, next) => {
  const userId = req.user.id;
  const isAdmin = req.project.adminId === userId;
  const isMember = req.project.members.some((member) => member.id === userId);
  if (!isAdmin && !isMember) throw new ApiError(403, "You do not have access to this project");
  next();
};

export const requireAdminRole = (req, _res, next) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Admin permission required");
  }
  next();
};

export const requireProjectAccess = asyncHandler(async (req, _res, next) => {
  const userId = req.user.id;
  if (req.project.adminId === userId) {
    next();
    return;
  }

  const assignedTasks = await prisma.task.count({
    where: { projectId: req.project.id, assignedToId: userId }
  });

  if (!assignedTasks) throw new ApiError(403, "You do not have access to this project");
  next();
});

export const requireProjectAdmin = (req, _res, next) => {
  if (req.project.adminId !== req.user.id) {
    throw new ApiError(403, "Project admin permission required");
  }
  next();
};

export const loadTask = asyncHandler(async (req, _res, next) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: {
      project: { include: { admin: true, members: true } },
      assignedTo: true,
      createdBy: true
    }
  });
  if (!task) throw new ApiError(404, "Task not found");
  req.task = task;
  req.project = task.project;
  next();
});

export const requireTaskAccess = (req, _res, next) => {
  const userId = req.user.id;
  const isProjectAdmin = req.project.adminId === userId;
  const isAssigned = req.task.assignedToId === userId;
  if (!isProjectAdmin && !isAssigned) {
    throw new ApiError(403, "You can only update tasks assigned to you");
  }
  next();
};
