import express from 'express';
import { validateRequestQuery } from '../../middlewares/validation.middleware';
import reviewValidation from '../../validations/stats/review.validation';
import reviewController from '../../controllers/stats/review.controller';
import { authenticate, isStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication and authorization middleware to all review stat routes
router.use(authenticate, isStaffOrAdmin);

/**
 * @swagger
 * tags:
 *   name: Statistics - Reviews
 *   description: Review and rating statistics (Requires STAFF or ADMIN role)
 */

/**
 * @swagger
 * /stats/reviews/summary:
 *   get:
 *     summary: Get overall review summary (average rating, counts)
 *     tags: [Statistics - Reviews]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *     responses:
 *       200:
 *         description: Review summary data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: Start date of the period used for 'newReviewsInPeriod'. Null if default period used.
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: End date of the period used for 'newReviewsInPeriod'. Null if default period used.
 *                 averageRating:
 *                   type: number
 *                   format: double
 *                   nullable: true
 *                   description: Average rating across all reviews. Null if no reviews exist.
 *                 totalReviews:
 *                   type: integer
 *                 newReviewsInPeriod:
 *                   type: integer
 */
router.get(
    '/summary',
    validateRequestQuery(reviewValidation.getReviewSummary.query),
    reviewController.getReviewSummary
);

/**
 * @swagger
 * /stats/reviews/rating-distribution:
 *   get:
 *     summary: Get the distribution of review counts by star rating
 *     tags: [Statistics - Reviews]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional. Filter distribution by a specific product ID.
 *     responses:
 *       200:
 *         description: Rating distribution data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 productId:
 *                   type: string
 *                   format: uuid
 *                   nullable: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rating:
 *                         type: integer
 *                         enum: [1, 2, 3, 4, 5]
 *                       count:
 *                         type: integer
 */
router.get(
    '/rating-distribution',
    validateRequestQuery(reviewValidation.getRatingDistribution.query),
    reviewController.getRatingDistribution
);

/**
 * @swagger
 * /stats/reviews/by-product:
 *   get:
 *     summary: Get paginated list of products with their review stats
 *     tags: [Statistics - Reviews]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Results per page.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [avgRatingDesc, avgRatingAsc, reviewCountDesc, reviewCountAsc]
 *           default: reviewCountDesc
 *         description: Sorting criterion.
 *       - in: query
 *         name: minReviews
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Minimum number of reviews a product must have to be included.
 *     responses:
 *       200:
 *         description: Paginated list of products with review stats.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalProducts:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       sku:
 *                         type: string
 *                       averageRating:
 *                         type: number
 *                         format: double
 *                         nullable: true
 *                       reviewCount:
 *                         type: integer
 */
router.get(
    '/by-product',
    validateRequestQuery(reviewValidation.getReviewsByProduct.query),
    reviewController.getReviewsByProduct
);


export default router;