import express from 'express';
import * as voucherController from '../controllers/voucher.controller';
import { validateRequestBody } from '../middlewares/validation.middleware';
import { createVoucherSchema, updateVoucherSchema } from '../validations/voucher.validation';
import { authenticate, isStaffOrAdmin } from '../middlewares/auth.middleware'; // Assuming these middlewares exist

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vouchers
 *   description: Voucher management and validation
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VoucherType:
 *       type: string
 *       enum: [PERCENT, FIXED]
 *     Voucher:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         code: { type: string }
 *         discountPercent: { type: number, format: float, nullable: true }
 *         discountAmount: { type: number, format: float, nullable: true }
 *         maxDiscount: { type: number, format: float, nullable: true }
 *         type: { $ref: '#/components/schemas/VoucherType' }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *         usageLimit: { type: integer, nullable: true }
 *         usedCount: { type: integer }
 *         minimumOrderValue: { type: number, format: float, nullable: true }
 *         isActive: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         applicableCategories: # Included in detailed responses
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string, format: uuid }
 *               name: { type: string }
 *         excludedProducts: # Included in detailed responses
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string, format: uuid }
 *               name: { type: string }
 *         _count: # Included in list response
 *           type: object
 *           properties:
 *             orders: { type: integer }
 *     VoucherInput:
 *       type: object
 *       required: [code, type, startDate, endDate]
 *       properties:
 *         code: { type: string }
 *         type: { $ref: '#/components/schemas/VoucherType' }
 *         discountPercent: { type: number, nullable: true, description: "Required if type=PERCENT" }
 *         discountAmount: { type: number, nullable: true, description: "Required if type=FIXED" }
 *         maxDiscount: { type: number, nullable: true }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *         usageLimit: { type: integer, nullable: true }
 *         minimumOrderValue: { type: number, nullable: true }
 *         isActive: { type: boolean, default: true }
 *         applicableCategoryIds: { type: array, items: { type: string, format: uuid } }
 *         excludedProductIds: { type: array, items: { type: string, format: uuid } }
 */

// --- Public or Semi-Public Routes ---

/**
 * @swagger
 * /vouchers/code/{code}:
 *   get:
 *     summary: Retrieve voucher details by code
 *     tags: [Vouchers]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *         description: The voucher code to look up
 *     responses:
 *       200:
 *         description: Voucher details (may exclude sensitive info like usedCount).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       404:
 *         description: Voucher not found or inactive
 */
router.get('/code/:code', voucherController.getVoucherByCodeHandler);


// --- Admin/Staff Routes ---

router.use(authenticate);
router.use(isStaffOrAdmin);

/**
 * @swagger
 * /vouchers:
 *   get:
 *     summary: Retrieve a list of all vouchers (Admin/Staff only)
 *     tags: [Vouchers]
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
 *         schema: { type: string, default: 'code' }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: 'asc' }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: A list of vouchers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Voucher'
 *                 total:
 *                   type: integer
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get('/', voucherController.getVouchers);

/**
 * @swagger
 * /vouchers/{id}:
 *   get:
 *     summary: Retrieve a specific voucher by ID (Admin/Staff only)
 *     tags: [Vouchers]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the voucher to retrieve
 *     responses:
 *       200:
 *         description: Voucher details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Voucher not found }
 */
router.get('/:id', voucherController.getVoucher);

/**
 * @swagger
 * /vouchers:
 *   post:
 *     summary: Create a new voucher (Admin/Staff only)
 *     tags: [Vouchers]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoucherInput'
 *     responses:
 *       201:
 *         description: Voucher created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       409: { description: Conflict (Duplicate code) }
 */
router.post(
    '/',
    validateRequestBody(createVoucherSchema),
    voucherController.createVoucherHandler
);

/**
 * @swagger
 * /vouchers/{id}:
 *   put:
 *     summary: Update an existing voucher (Admin/Staff only)
 *     tags: [Vouchers]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the voucher to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoucherInput' # Can reuse or create UpdateVoucherInput
 *     responses:
 *       200:
 *         description: Voucher updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voucher'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Voucher not found }
 *       409: { description: Conflict (Duplicate code) }
 */
router.put(
    '/:id',
    validateRequestBody(updateVoucherSchema),
    voucherController.updateVoucherHandler
);

/**
 * @swagger
 * /vouchers/{id}:
 *   delete:
 *     summary: Delete a voucher (Admin/Staff only)
 *     tags: [Vouchers]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the voucher to delete
 *     responses:
 *       204: { description: Voucher deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Voucher not found }
 */
router.delete(
    '/:id',
    voucherController.deleteVoucherHandler
);

export default router;
