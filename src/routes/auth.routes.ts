import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller"; // Keep path without extension
import { authenticate } from "../middlewares/auth.middleware";
import { validateRequestBody } from "../middlewares/validation.middleware"; // Import validation middleware
import { loginUserSchema, registerUserSchema } from "../validations/user.validation"; // Import schemas

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, logout, and profile management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: User's password
 *               name:
 *                 type: string
 *                 description: User's display name (optional)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSafe' # Define UserSafe schema globally if needed
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.post("/register", validateRequestBody(registerUserSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful, sets access_token cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSafe'
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: access_token=abcde12345; Path=/; HttpOnly; Secure; SameSite=Lax
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/login", validateRequestBody(loginUserSchema), login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful, clears access_token cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *       500:
 *         description: Internal server error
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: [] # Assuming cookie-based auth defined in swagger.config.ts
 *       # Or use bearerAuth if using Authorization header
 *       # - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSafe'
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       500:
 *         description: Internal server error
 */
router.get("/me", authenticate, me);

export default router;
