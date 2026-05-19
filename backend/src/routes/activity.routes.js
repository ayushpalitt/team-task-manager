import { Router } from "express";
import { listActivity } from "../controllers/activity.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.get("/", listActivity);

export default router;
