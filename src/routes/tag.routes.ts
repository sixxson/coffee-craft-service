import express from 'express';
import * as tagController from '../controllers/tag.controller';
import { validateRequestBody } from '../middlewares/validation.middleware'; // Use the correct export
import { createTagSchema, updateTagSchema } from '../validations/tag.validation';
import { authenticate, isStaffOrAdmin } from '../middlewares/auth.middleware'; // Import auth middleware

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Product tag management
 */

// Schema for Tag is defined in product.routes.ts or globally

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Retrieve a list of tags
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: 'name' }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: 'asc' }
 *     responses:
 *       200:
 *         description: A list of tags with product counts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag' # Reference the full Tag schema
 *                 total:
 *                   type: integer
 */
router.get('/', tagController.getTags);

/**
 * @swagger
 * /tags/{id}:
 *   get:
 *     summary: Retrieve a single tag by ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the tag to retrieve
 *     responses:
 *       200:
 *         description: Tag details with product count.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Tag not found
 */
router.get('/:id', tagController.getTag);

// --- Admin/Staff Routes ---
// router.use(authenticate); // Apply authentication if needed for modification
// router.use(isStaffOrAdmin); // Apply role check if needed

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Create a new tag
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: [] # Add appropriate security
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Tag created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       409: { description: Conflict (Tag name already exists) }
 */
router.post(
    '/',
    // authenticate, // Add middleware
    // isStaffOrAdmin,
    validateRequestBody(createTagSchema),
    tagController.createTagHandler
);

/**
 * @swagger
 * /tags/{id}:
 *   put:
 *     summary: Update an existing tag
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the tag to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Tag updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Tag not found }
 *       409: { description: Conflict (Tag name already exists) }
 */
router.put(
    '/:id',
    // authenticate,
    // isStaffOrAdmin,
    validateRequestBody(updateTagSchema),
    tagController.updateTagHandler
);

/**
 * @swagger
 * /tags/{id}:
 *   delete:
 *     summary: Delete a tag
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the tag to delete
 *     responses:
 *       204: { description: Tag deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Tag not found }
 *       409: { description: Conflict (e.g., if deletion constraints existed) }
 */
router.delete(
    '/:id',
    // authenticate,
    // isStaffOrAdmin,
    tagController.deleteTagHandler
);

export default router;
