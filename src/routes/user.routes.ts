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

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (primarily for Admins/Staff, and users managing their own profile)
 */

// Schema for UserSafe should be defined globally or referenced from another file

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of all users (Admin/Staff only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: 'createdAt' }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: 'desc' }
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserSafe'
 *                 total:
 *                   type: integer
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get("/",
  authenticate,
  // isStaffOrAdmin,
  getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Retrieve a specific user's profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the user to retrieve ('me' can be used for current user)
 *     responses:
 *       200:
 *         description: User profile details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSafe'
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (Trying to access another user without permission) }
 *       404: { description: User not found }
 */
router.get("/:id", authenticate, getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user's profile
 *     tags: [Users]
 *     description: Allows a user to update their own profile, or an Admin/Staff to update any user's profile (including role and active status). Requires oldPassword if user updates own password.
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string, nullable: true }
 *               address: { type: string, nullable: true }
 *               imgUrl: { type: string, format: uri, nullable: true }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER], nullable: true }
 *               dob: { type: string, format: date, nullable: true, description: "YYYY-MM-DD" }
 *               password: { type: string, format: password, minLength: 6, description: "New password (optional)" }
 *               oldPassword: { type: string, format: password, description: "Required if user updates own password" }
 *               # Admin/Staff only fields:
 *               isActive: { type: boolean }
 *               role: { type: string, enum: [CUSTOMER, STAFF, ADMIN] }
 *     responses:
 *       200:
 *         description: User profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSafe'
 *       400: { description: Validation error or incorrect old password }
 *       401: { description: Unauthorized or incorrect old password }
 *       403: { description: Forbidden (User cannot update other user / change role) }
 *       404: { description: User not found }
 */
router.put(
  "/:id",
  authenticate,
  validateRequestBody(updateUserProfileSchema), // Note: Might need a separate schema/validation for admin updates if fields differ significantly
  updateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the user to delete
 *     responses:
 *       204: { description: User deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: User not found }
 */
router.delete("/:id", authenticate, isAdmin, deleteUser);

export default router;
