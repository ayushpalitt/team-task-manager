import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { serializeUser } from "../utils/serializers.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = {};
  if (req.body.name) allowed.name = req.body.name;
  if (req.body.avatarColor) allowed.avatarColor = req.body.avatarColor;

  const user = await prisma.user.update({ where: { id: req.user.id }, data: allowed });
  res.json({ user: serializeUser(user) });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const search = req.query.search || "";
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    },
    select: { id: true, name: true, email: true, avatarColor: true, role: true, createdAt: true, updatedAt: true },
    take: 12,
    orderBy: { name: "asc" }
  });

  res.json({ users: users.map(serializeUser) });
});

export const listUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new ApiError(403, "Admin permission required");

  const search = req.query.search || "";
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }
      : {},
    select: {
      id: true,
      name: true,
      email: true,
      avatarColor: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          memberProjects: true,
          assignedTasks: true
        }
      }
    },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });

  const activeGroups = await prisma.task.groupBy({
    by: ["assignedToId"],
    where: { status: { not: "done" } },
    _count: { _all: true }
  });
  const activeByUser = new Map(activeGroups.map((group) => [group.assignedToId, group._count._all]));

  res.json({
    users: users.map((user) => ({
      ...serializeUser(user),
      activeTaskCount: activeByUser.get(user.id) || 0,
      projectCount: user._count.memberProjects,
      taskCount: user._count.assignedTasks,
      _count: undefined
    }))
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new ApiError(403, "Admin permission required");
  if (req.params.userId === req.user.id) throw new ApiError(400, "You cannot remove your own account");

  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(400, "Admin accounts cannot be removed here");

  const impactedTasks = await prisma.task.findMany({
    where: { OR: [{ assignedToId: user.id }, { createdById: user.id }] },
    select: { id: true, assignedToId: true, createdById: true, project: { select: { adminId: true } } }
  });

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      impactedTasks.map((task) =>
        tx.task.update({
          where: { id: task.id },
          data: {
            ...(task.assignedToId === user.id ? { assignedToId: task.project.adminId } : {}),
            ...(task.createdById === user.id ? { createdById: task.project.adminId } : {})
          }
        })
      )
    );
    await tx.user.update({
      where: { id: user.id },
      data: { memberProjects: { set: [] } }
    });
    await tx.user.delete({ where: { id: user.id } });
  });

  res.status(204).send();
});
