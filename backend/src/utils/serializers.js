export const serializeUser = (user) => {
  if (!user) return user;
  const { id, password, ...rest } = user;
  return { _id: id, ...rest };
};

export const serializeProject = (project) => {
  if (!project) return project;
  const { id, adminId, ...rest } = project;
  return {
    _id: id,
    ...rest,
    admin: serializeUser(project.admin),
    members: project.members?.map(serializeUser) || []
  };
};

export const serializeTask = (task) => {
  if (!task) return task;
  const { id, assignedToId, projectId, createdById, ...rest } = task;
  return {
    _id: id,
    ...rest,
    assignedTo: serializeUser(task.assignedTo),
    createdBy: serializeUser(task.createdBy),
    project: task.project ? serializeProject(task.project) : projectId
  };
};

export const serializeActivity = (activity) => {
  if (!activity) return activity;
  const { id, actorId, projectId, taskId, ...rest } = activity;
  return {
    _id: id,
    ...rest,
    project: projectId,
    actor: serializeUser(activity.actor),
    task: serializeTask(activity.task)
  };
};
