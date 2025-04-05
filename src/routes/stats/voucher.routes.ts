import express from 'express';
import { validateRequestQuery } from '../../middlewares/validation.middleware';
import voucherValidation from '../../validations/stats/voucher.validation';
import voucherController from '../../controllers/stats/voucher.controller';
import { authenticate, isStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// Apply authentication and authorization middleware to all voucher stat routes
router.use(authenticate, isStaffOrAdmin);

/**
 * @swagger
 * tags:
 *   name: Statistics - Vouchers
 *   description: Voucher usage and effectiveness statistics (Requires STAFF or ADMIN role)
 */

/**
 * @swagger
 * /stats/vouchers/usage:
 *   get:
 *     summary: Get voucher usage statistics (most used, highest discount)
 *     tags: [Statistics - Vouchers]
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
 *         description: Maximum number of vouchers to return.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [usageCount, totalDiscount]
 *           default: usageCount
 *         description: Criterion to sort vouchers by.
 *     responses:
 *       200:
 *         description: List of top vouchers by usage or discount amount.
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
 *                 sortBy:
 *                   type: string
 *                   enum: [usageCount, totalDiscount]
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       voucherId:
 *                         type: string
 *                         format: uuid
 *                       code:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [PERCENT, FIXED]
 *                       usageCount:
 *                         type: integer
 *                       totalDiscountGiven:
 *                         type: number
 *                         format: double
 */
router.get(
    '/usage',
    validateRequestQuery(voucherValidation.getVoucherUsage.query),
    voucherController.getVoucherUsage
);

/**
 * @swagger
 * /stats/vouchers/effectiveness:
 *   get:
 *     summary: Get effectiveness metrics for specific or all vouchers
 *     tags: [Statistics - Vouchers]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *       - in: query
 *         name: voucherCode
 *         schema:
 *           type: string
 *         description: Optional. Filter by a specific voucher code.
 *     responses:
 *       200:
 *         description: Effectiveness data for the specified voucher(s).
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       voucherId:
 *                         type: string
 *                         format: uuid
 *                       code:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [PERCENT, FIXED]
 *                       usageCount:
 *                         type: integer
 *                       totalDiscountGiven:
 *                         type: number
 *                         format: double
 *                       totalRevenueFromOrders:
 *                         type: number
 *                         format: double
 *                         description: Total finalTotal of orders that used this voucher in the period.
 */
router.get(
    '/effectiveness',
    validateRequestQuery(voucherValidation.getVoucherEffectiveness.query),
    voucherController.getVoucherEffectiveness
);


export default router;