import { Router } from "express";
import { deleteTask, listMyTasks, updateTask } from "../controllers/task.controller.js";
import { authenticate, loadTask, requireTaskAccess } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { taskParamsSchema, updateTaskSchema } from "../validators/task.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", listMyTasks);
router.patch("/:taskId", validate(updateTaskSchema), loadTask, requireTaskAccess, updateTask);
router.delete("/:taskId", validate(taskParamsSchema), loadTask, requireTaskAccess, deleteTask);

export default router;
