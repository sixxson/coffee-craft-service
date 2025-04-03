import express from 'express';
import * as reviewController from '../controllers/review.controller';
import { validateRequestBody } from '../middlewares/validation.middleware';
import { createReviewSchema, updateReviewSchema } from '../validations/review.validation';
import { authenticate } from '../middlewares/auth.middleware'; // Use correct middleware name

const router = express.Router({ mergeParams: true }); // Enable params merging (e.g., if mounted under /products/:productId)

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product review management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           nullable: true
 *         orderItemId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         productVariantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         user: # Included in some responses
 *           type: object
 *           properties:
 *             id: { type: string, format: uuid }
 *             name: { type: string, nullable: true }
 *             imgUrl: { type: string, format: uri, nullable: true }
 *     CreateReviewInput:
 *       type: object
 *       required:
 *         - orderItemId
 *         - rating
 *       properties:
 *         orderItemId:
 *           type: string
 *           format: uuid
 *           description: The ID of the specific order item being reviewed.
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           maxLength: 1000
 *           nullable: true
 *     UpdateReviewInput:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *           maxLength: 1000
 *           nullable: true
 */

// --- Routes typically accessed by authenticated users ---

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review for an order item
 *     tags: [Reviews]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden (User does not own order item) }
 *       404: { description: Order item not found }
 *       409: { description: Conflict (Review already exists for this item) }
 */
router.post(
    '/',
    authenticate,
    validateRequestBody(createReviewSchema),
    reviewController.createReviewHandler
);

/**
 * @swagger
 * /reviews/my:
 *   get:
 *     summary: Retrieve reviews submitted by the current user
 *     tags: [Reviews]
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
 *         description: A list of the user's reviews.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review' # Adjust based on actual response
 *                 total:
 *                   type: integer
 *       401: { description: Unauthorized }
 */
router.get(
    '/my',
    authenticate,
    reviewController.getMyReviews
);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   put:
 *     summary: Update a specific review (Owner or Admin only)
 *     tags: [Reviews]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the review to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReviewInput'
 *     responses:
 *       200:
 *         description: Review updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Review not found }
 */
router.put(
    '/:reviewId',
    authenticate,
    validateRequestBody(updateReviewSchema),
    reviewController.updateReviewHandler
);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   delete:
 *     summary: Delete a specific review (Owner or Admin only)
 *     tags: [Reviews]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the review to delete
 *     responses:
 *       204: { description: Review deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Review not found }
 */
router.delete(
    '/:reviewId',
    authenticate,
    reviewController.deleteReviewHandler
);


// --- Publicly accessible routes (or adjust protection) ---

// Note: Route for getting reviews by product ID is better nested under products
// See API_DOCUMENTATION.md for the suggested route: GET /products/:productId/reviews


export default router;
