import express from 'express';
import * as reviewController from '../controllers/review.controller';
import { validateRequestBody } from '../middlewares/validation.middleware';
import { createReviewSchema, updateReviewSchema } from '../validations/review.validation';
import { authenticate } from '../middlewares/auth.middleware'; // Use correct middleware name

const router = express.Router({ mergeParams: true }); // Enable params merging (e.g., if mounted under /products/:productId)

// --- Routes typically accessed by authenticated users ---

// POST /reviews - Create a new review (requires authentication)
// Assumes orderItemId is in the body. User ID comes from req.user.
router.post(
    '/',
    authenticate, // Apply authentication middleware
    validateRequestBody(createReviewSchema),
    reviewController.createReviewHandler
);

// GET /reviews/my - Get reviews submitted by the logged-in user
router.get(
    '/my',
    authenticate, // Apply authentication middleware
    reviewController.getMyReviews
);

// PUT /reviews/:reviewId - Update a specific review (requires authentication)
router.put(
    '/:reviewId',
    authenticate, // Apply authentication middleware
    validateRequestBody(updateReviewSchema),
    reviewController.updateReviewHandler
);

// DELETE /reviews/:reviewId - Delete a specific review (requires authentication)
router.delete(
    '/:reviewId',
    authenticate, // Apply authentication middleware
    reviewController.deleteReviewHandler
);


// --- Publicly accessible routes (or adjust protection) ---

// GET /reviews/product/:productId - Get all reviews for a specific product
// This route might be nested under products instead, e.g., GET /products/:productId/reviews
// If kept here, it doesn't need mergeParams unless mounted differently.
// Let's assume it's a top-level route for now.
// If you prefer nesting under products, this route definition would move to product.routes.ts
// router.get('/product/:productId', reviewController.getProductReviews);


export default router;
