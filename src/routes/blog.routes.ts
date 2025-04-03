import express from 'express';
import * as blogController from '../controllers/blog.controller';
import { validateRequestBody } from '../middlewares/validation.middleware';
import { createBlogSchema, updateBlogSchema } from '../validations/blog.validation';
import { authenticate, isStaffOrAdmin } from '../middlewares/auth.middleware'; // Assuming these middlewares exist

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Blog post management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         title: { type: string }
 *         content: { type: string }
 *         thumbnail: { type: string, format: uri, nullable: true }
 *         userId: { type: string, format: uuid }
 *         publicationDate: { type: string, format: date-time }
 *         active: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         author: # Included in responses
 *           type: object
 *           properties:
 *             id: { type: string, format: uuid }
 *             name: { type: string, nullable: true }
 *             imgUrl: { type: string, format: uri, nullable: true }
 *     BlogInput:
 *       type: object
 *       required: [title, content]
 *       properties:
 *         title: { type: string, maxLength: 255 }
 *         content: { type: string }
 *         thumbnail: { type: string, format: uri, nullable: true }
 *         publicationDate: { type: string, format: date-time, nullable: true, description: "Defaults to now if omitted" }
 *         active: { type: boolean, default: true }
 */

// --- Public Routes ---

/**
 * @swagger
 * /blogs:
 *   get:
 *     summary: Retrieve a list of blog posts
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: 'publicationDate' }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: 'desc' }
 *       - in: query
 *         name: active
 *         schema: { type: boolean, description: "Admin/Staff can use 'false' to see inactive posts" }
 *       - in: query
 *         name: authorId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: A list of blog posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *                 total:
 *                   type: integer
 */
router.get('/', blogController.getBlogs);

/**
 * @swagger
 * /blogs/{id}:
 *   get:
 *     summary: Retrieve a single blog post by ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the blog post to retrieve
 *     responses:
 *       200:
 *         description: Blog post details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Blog post not found (or inactive for public view)
 */
router.get('/:id', blogController.getBlog);


// --- Admin/Staff Routes ---

router.use(authenticate);
router.use(isStaffOrAdmin);

/**
 * @swagger
 * /blogs:
 *   post:
 *     summary: Create a new blog post (Admin/Staff only)
 *     tags: [Blogs]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogInput'
 *     responses:
 *       201:
 *         description: Blog post created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.post(
    '/',
    validateRequestBody(createBlogSchema),
    blogController.createBlogHandler
);

/**
 * @swagger
 * /blogs/{id}:
 *   put:
 *     summary: Update an existing blog post (Author/Admin/Staff only)
 *     tags: [Blogs]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the blog post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogInput' # Can reuse or create UpdateBlogInput
 *     responses:
 *       200:
 *         description: Blog post updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Blog post not found }
 */
router.put(
    '/:id',
    validateRequestBody(updateBlogSchema),
    blogController.updateBlogHandler
);

/**
 * @swagger
 * /blogs/{id}:
 *   delete:
 *     summary: Delete a blog post (Author/Admin/Staff only)
 *     tags: [Blogs]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the blog post to delete
 *     responses:
 *       204: { description: Blog post deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Blog post not found }
 */
router.delete(
    '/:id',
    blogController.deleteBlogHandler
);

export default router;
