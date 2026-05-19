import { Router } from "express";
import {
  addMember,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  removeMember,
  updateProject
} from "../controllers/project.controller.js";
import { createTask, listTasks } from "../controllers/task.controller.js";
import {
  authenticate,
  requireAdminRole,
  loadProject,
  requireProjectAccess,
  requireProjectAdmin,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProjectSchema,
  memberSchema,
  projectParamsSchema,
  updateProjectSchema
} from "../validators/project.validator.js";
import { createTaskSchema, listTasksSchema } from "../validators/task.validator.js";

const router = Router();

router.use(authenticate);
router.get("/", listProjects);
router.post("/", requireAdminRole, validate(createProjectSchema), createProject);

router.get(
  "/:projectId",
  validate(projectParamsSchema),
  loadProject,
  requireProjectAccess,
  getProject
);

router.patch(
  "/:projectId",
  validate(updateProjectSchema),
  loadProject,
  requireAdminRole,
  requireProjectAdmin,
  updateProject
);

router.delete(
  "/:projectId",
  validate(projectParamsSchema),
  loadProject,
  requireAdminRole,
  requireProjectAdmin,
  deleteProject
);

router.post(
  "/:projectId/members",
  validate(memberSchema),
  loadProject,
  requireAdminRole,
  requireProjectAdmin,
  addMember
);

router.delete(
  "/:projectId/members/:userId",
  validate(memberSchema),
  loadProject,
  requireAdminRole,
  requireProjectAdmin,
  removeMember
);

router.get(
  "/:projectId/tasks",
  validate(listTasksSchema),
  loadProject,
  requireProjectAccess,
  listTasks
);

router.post(
  "/:projectId/tasks",
  validate(createTaskSchema),
  loadProject,
  requireAdminRole,
  requireProjectAdmin,
  createTask
);

export default router;
