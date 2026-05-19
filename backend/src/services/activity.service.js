import { prisma } from "../config/db.js";
import { getIO } from "../sockets/index.js";
import { serializeActivity } from "../utils/serializers.js";

export const logActivity = async ({ type, message, actor, project, task }) => {
  const activity = await prisma.activity.create({
    data: { type, message, actorId: actor, projectId: project, taskId: task },
    include: {
      actor: true,
      task: {
        include: {
          assignedTo: true,
          createdBy: true,
          project: { include: { admin: true, members: true } }
        }
      }
    }
  });
  const populated = serializeActivity(activity);

  if (project) {
    getIO()?.to(`project:${project}`).emit("activity:created", populated);
  }

  return populated;
};
