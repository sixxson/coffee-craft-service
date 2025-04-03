import express from 'express';
import * as blogController from '../controllers/blog.controller';
import { validateRequestBody } from '../middlewares/validation.middleware';
import { createBlogSchema, updateBlogSchema } from '../validations/blog.validation';
import { authenticate, isStaffOrAdmin } from '../middlewares/auth.middleware'; // Assuming these middlewares exist

const router = express.Router();

// --- Public Routes ---

// GET /blogs - Get all published/active blog posts (add filtering logic in controller/service)
router.get('/', blogController.getBlogs);

// GET /blogs/:id - Get a specific published/active blog post by ID
router.get('/:id', blogController.getBlog);


// --- Admin/Staff Routes ---

// Apply authentication and role check for all subsequent routes
router.use(authenticate);
router.use(isStaffOrAdmin); // Only Staff/Admin can manage blog posts

// POST /blogs - Create a new blog post
router.post(
    '/',
    validateRequestBody(createBlogSchema),
    blogController.createBlogHandler
);

// PUT /blogs/:id - Update an existing blog post
router.put(
    '/:id',
    validateRequestBody(updateBlogSchema),
    blogController.updateBlogHandler
);

// DELETE /blogs/:id - Delete a blog post
router.delete(
    '/:id',
    blogController.deleteBlogHandler
);

export default router;
