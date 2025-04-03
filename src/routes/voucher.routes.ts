import express from 'express';
import * as voucherController from '../controllers/voucher.controller';
import { validateRequestBody } from '../middlewares/validation.middleware';
import { createVoucherSchema, updateVoucherSchema } from '../validations/voucher.validation';
import { authenticate, isStaffOrAdmin } from '../middlewares/auth.middleware'; // Assuming these middlewares exist

const router = express.Router();

// --- Public or Semi-Public Routes ---

// GET /vouchers/code/:code - Get voucher details by code (e.g., for customer validation before applying)
// Might not need authentication depending on requirements
router.get('/code/:code', voucherController.getVoucherByCodeHandler);


// --- Admin/Staff Routes ---

// Apply authentication and role check for all subsequent routes
router.use(authenticate);
router.use(isStaffOrAdmin); // Or just isAdmin if only admins manage vouchers

// GET /vouchers - Get all vouchers (Admin/Staff)
router.get('/', voucherController.getVouchers);

// GET /vouchers/:id - Get a specific voucher by ID (Admin/Staff)
router.get('/:id', voucherController.getVoucher);

// POST /vouchers - Create a new voucher (Admin/Staff)
router.post(
    '/',
    validateRequestBody(createVoucherSchema),
    voucherController.createVoucherHandler
);

// PUT /vouchers/:id - Update an existing voucher (Admin/Staff)
router.put(
    '/:id',
    validateRequestBody(updateVoucherSchema),
    voucherController.updateVoucherHandler
);

// DELETE /vouchers/:id - Delete a voucher (Admin/Staff)
router.delete(
    '/:id',
    voucherController.deleteVoucherHandler
);

export default router;
