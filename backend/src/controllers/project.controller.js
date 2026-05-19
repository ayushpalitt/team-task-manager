import { prisma } from "../config/db.js";
import { sendInviteEmail } from "../services/email.service.js";
import { logActivity } from "../services/activity.service.js";
import { getIO } from "../sockets/index.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getPagination } from "../utils/pagination.js";
import { serializeProject, serializeUser } from "../utils/serializers.js";

const projectInclude = { admin: true, members: true };

const withProgress = async (project) => {
  const [total, done, activeTaskGroups] = await Promise.all([
    prisma.task.count({ where: { projectId: project.id } }),
    prisma.task.count({ where: { projectId: project.id, status: "done" } }),
    prisma.task.groupBy({
      by: ["assignedToId"],
      where: { projectId: project.id, status: { not: "done" } },
      _count: { _all: true }
    })
  ]);
  const activeTasksByUser = new Map(activeTaskGroups.map((group) => [group.assignedToId, group._count._all]));
  const serialized = serializeProject(project);

  return {
    ...serialized,
    members: serialized.members.map((member) => ({
      ...member,
      activeTaskCount: activeTasksByUser.get(member._id) || 0
    })),
    progress: total ? Math.round((done / total) * 100) : 0,
    taskCounts: { total, done }
  };
};

export const listProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const search = req.query.search || "";
  const accessWhere =
    req.user.role === "admin"
      ? { OR: [{ adminId: req.user.id }, { members: { some: { id: req.user.id } } }] }
      : { tasks: { some: { assignedToId: req.user.id } } };

  const where = {
    AND: [
      accessWhere,
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}
    ]
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({ where, include: projectInclude, orderBy: { updatedAt: "desc" }, skip, take: limit }),
    prisma.project.count({ where })
  ]);

  const data = await Promise.all(projects.map(withProgress));
  res.json({ projects: data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const createProject = asyncHandler(async (req, res) => {
  const memberIds = Array.from(new Set([req.user.id, ...(req.body.memberIds || [])]));
  const members = await prisma.user.findMany({ where: { id: { in: memberIds } }, select: { id: true } });
  if (members.length !== memberIds.length) throw new ApiError(400, "One or more selected members do not exist");

  const project = await prisma.project.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      adminId: req.user.id,
      members: { connect: memberIds.map((id) => ({ id })) }
    },
    include: projectInclude
  });

  await logActivity({
    type: "project.created",
    message: `${req.user.name} created ${project.title}`,
    actor: req.user.id,
    project: project.id
  });

  res.status(201).json({ project: await withProgress(project) });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.project.id }, include: projectInclude });
  res.json({ project: await withProgress(project) });
});

export const updateProject = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;

  const project = await prisma.project.update({ where: { id: req.project.id }, data: updates, include: projectInclude });

  await logActivity({
    type: "project.updated",
    message: `${req.user.name} updated ${project.title}`,
    actor: req.user.id,
    project: project.id
  });

  getIO()?.to(`project:${project.id}`).emit("project:updated", serializeProject(project));
  res.json({ project: await withProgress(project) });
});

export const deleteProject = asyncHandler(async (req, res) => {
  await logActivity({
    type: "project.deleted",
    message: `${req.user.name} deleted ${req.project.title}`,
    actor: req.user.id,
    project: req.project.id
  });
  await prisma.project.delete({ where: { id: req.project.id } });
  getIO()?.to(`project:${req.project.id}`).emit("project:deleted", { projectId: req.project.id });
  res.status(204).send();
});

export const addMember = asyncHandler(async (req, res) => {
  const user = req.body.userId
    ? await prisma.user.findUnique({ where: { id: req.body.userId } })
    : await prisma.user.findUnique({ where: { email: req.body.email?.toLowerCase() } });

  if (!user) throw new ApiError(404, "User not found");

  const alreadyMember = req.project.members.some((member) => member.id === user.id);
  if (!alreadyMember) {
    await prisma.project.update({
      where: { id: req.project.id },
      data: { members: { connect: { id: user.id } } }
    });
  }

  await sendInviteEmail({ to: user.email, projectTitle: req.project.title, inviterName: req.user.name });
  await logActivity({
    type: "member.added",
    message: `${req.user.name} added ${user.name} to ${req.project.title}`,
    actor: req.user.id,
    project: req.project.id
  });

  const project = await prisma.project.findUnique({ where: { id: req.project.id }, include: projectInclude });
  getIO()?.to(`project:${req.project.id}`).emit("member:added", { project: serializeProject(project), user: serializeUser(user) });
  res.json({ project: await withProgress(project) });
});

export const removeMember = asyncHandler(async (req, res) => {
  if (req.project.adminId === req.params.userId) {
    throw new ApiError(400, "Project admin cannot be removed");
  }

  await prisma.project.update({
    where: { id: req.project.id },
    data: { members: { disconnect: { id: req.params.userId } } }
  });
  await prisma.task.updateMany({
    where: { projectId: req.project.id, assignedToId: req.params.userId },
    data: { assignedToId: req.project.adminId }
  });

  await logActivity({
    type: "member.removed",
    message: `${req.user.name} removed a member from ${req.project.title}`,
    actor: req.user.id,
    project: req.project.id
  });

  const project = await prisma.project.findUnique({ where: { id: req.project.id }, include: projectInclude });
  getIO()?.to(`project:${req.project.id}`).emit("member:removed", { project: serializeProject(project), userId: req.params.userId });
  res.json({ project: await withProgress(project) });
});
