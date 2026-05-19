import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/async-handler.js";
import { serializeActivity } from "../utils/serializers.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const projects = await prisma.project.findMany({
    where:
      req.user.role === "admin"
        ? { OR: [{ adminId: req.user.id }, { members: { some: { id: req.user.id } } }] }
        : { tasks: { some: { assignedToId: req.user.id } } },
    select: { id: true }
  });
  const projectIds = projects.map((project) => project.id);
  const now = new Date();
  const taskWhere =
    req.user.role === "admin"
      ? { projectId: { in: projectIds } }
      : { projectId: { in: projectIds }, assignedToId: req.user.id };

  const [totalTasks, completedTasks, overdueTasks, statusGroups, userGroups, recentActivity] = await Promise.all([
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { ...taskWhere, status: "done" } }),
    prisma.task.count({ where: { ...taskWhere, dueDate: { lt: now }, status: { not: "done" } } }),
    prisma.task.groupBy({
      by: ["status"],
      where: taskWhere,
      _count: { _all: true }
    }),
    prisma.task.groupBy({
      by: ["assignedToId"],
      where: taskWhere,
      _count: { _all: true },
      orderBy: { _count: { assignedToId: "desc" } }
    }),
    prisma.activity.findMany({
      where: { projectId: { in: projectIds }, ...(req.user.role === "admin" ? {} : { actorId: req.user.id }) },
      include: {
        actor: true,
        task: { include: { assignedTo: true, createdBy: true, project: { include: { admin: true, members: true } } } }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const users = userGroups.length
    ? await prisma.user.findMany({ where: { id: { in: userGroups.map((group) => group.assignedToId) } } })
    : [];
  const userById = new Map(users.map((user) => [user.id, user]));

  res.json({
    totals: {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      overdueTasks
    },
    tasksByStatus: statusGroups.map((group) => ({ name: group.status, value: group._count._all })),
    tasksPerUser: userGroups.map((group) => ({
      name: userById.get(group.assignedToId)?.name || "Unassigned",
      value: group._count._all
    })),
    recentActivity: recentActivity.map(serializeActivity)
  });
});
