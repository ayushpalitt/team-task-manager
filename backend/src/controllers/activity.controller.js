import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getPagination } from "../utils/pagination.js";
import { serializeActivity } from "../utils/serializers.js";

export const listActivity = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const projects = await prisma.project.findMany({
    where: { OR: [{ adminId: req.user.id }, { members: { some: { id: req.user.id } } }] },
    select: { id: true }
  });
  const projectIds = projects.map((project) => project.id);

  const [activity, total] = await Promise.all([
    prisma.activity.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        actor: true,
        task: { include: { assignedTo: true, createdBy: true, project: { include: { admin: true, members: true } } } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.activity.count({ where: { projectId: { in: projectIds } } })
  ]);

  res.json({ activity: activity.map(serializeActivity), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
