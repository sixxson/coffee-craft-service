import express from 'express';
import { validateRequestQuery } from '../../middlewares/validation.middleware';
import userValidation from '../../validations/stats/user.validation';
import userController from '../../controllers/stats/user.controller';
import { authenticate, isStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication and authorization middleware to all user stat routes
router.use(authenticate, isStaffOrAdmin);

/**
 * @swagger
 * tags:
 *   name: Statistics - Users
 *   description: User related statistics (Requires STAFF or ADMIN role)
 */

/**
 * @swagger
 * /stats/users/summary:
 *   get:
 *     summary: Get user registration and activity summary
 *     tags: [Statistics - Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *       - in: query
 *         name: activeThresholdDays
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 30
 *         description: Number of days to look back for active users based on last login.
 *     responses:
 *       200:
 *         description: User summary data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                   description: Start date of the period used for 'newUsersInPeriod'. Null if default period used.
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                   description: End date of the period used for 'newUsersInPeriod'. Null if default period used.
 *                 totalUsers:
 *                   type: integer
 *                 newUsersInPeriod:
 *                   type: integer
 *                 activeUsers:
 *                   type: integer
 */
router.get(
    '/summary',
    validateRequestQuery(userValidation.getUserSummary.query),
    userController.getUserSummary
);

/**
 * @swagger
 * /stats/users/role-distribution:
 *   get:
 *     summary: Get distribution of users by role
 *     tags: [Statistics - Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User role distribution.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         enum: [CUSTOMER, STAFF, ADMIN]
 *                       count:
 *                         type: integer
 */
router.get(
    '/role-distribution',
    // No specific validation needed for query params
    userController.getRoleDistribution
);

/**
 * @swagger
 * /stats/users/top-spenders:
 *   get:
 *     summary: Get list of top spending customers
 *     tags: [Statistics - Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of users to return.
 *     responses:
 *       200:
 *         description: List of top spending users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 limit:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         nullable: true
 *                       email:
 *                         type: string
 *                         format: email
 *                       totalSpent:
 *                         type: number
 *                         format: double
 *                       orderCount:
 *                         type: integer
 */
router.get(
    '/top-spenders',
    validateRequestQuery(userValidation.getTopSpenders.query),
    userController.getTopSpenders
);

/**
 * @swagger
 * /stats/users/new-registrations:
 *   get:
 *     summary: Get trend of new user registrations over time
 *     tags: [Statistics - Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Time unit to group registrations by.
 *     responses:
 *       200:
 *         description: New registration trend data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 groupBy:
 *                   type: string
 *                   enum: [day, week, month]
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         description: Date/Week/Month identifier (e.g., YYYY-MM-DD, YYYY-WW, YYYY-MM).
 *                       count:
 *                         type: integer
 */
router.get(
    '/new-registrations',
    validateRequestQuery(userValidation.getNewRegistrations.query),
    userController.getNewRegistrations
);


export default router;