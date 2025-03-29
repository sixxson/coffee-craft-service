import { Router } from "express";

import {
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../controllers/user.controller";
import { authenticate, isAdmin, isStaffOrAdmin } from "../middlewares/auth.middleware";
import { validateRequestBody } from "../middlewares/validation.middleware";
import { updateUserProfileSchema } from "../validations/user.validation";

const router = Router();

router.get("/", authenticate, isStaffOrAdmin, getAllUsers);
router.get("/:id", authenticate, getUserById); // User getting their own or admin getting any? Controller logic determines access.
router.put(
  "/:id",
  authenticate, // Ensures user is logged in
  validateRequestBody(updateUserProfileSchema), // Validate request body for profile update
  updateUser // Controller should verify user is updating their own profile or is admin
);
router.delete("/:id", authenticate, isAdmin, deleteUser); // Only admin can delete

export default router;
