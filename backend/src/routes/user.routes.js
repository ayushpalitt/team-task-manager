import { Router } from "express";
import { deleteUser, listUsers, searchUsers, updateProfile } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateProfileSchema, userParamsSchema } from "../validators/user.validator.js";

const router = Router();

router.use(authenticate);
router.get("/", listUsers);
router.get("/search", searchUsers);
router.patch("/profile", validate(updateProfileSchema), updateProfile);
router.delete("/:userId", validate(userParamsSchema), deleteUser);

export default router;
