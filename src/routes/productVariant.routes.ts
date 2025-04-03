import express from 'express';
import * as variantController from '../controllers/productVariant.controller';
import { validateRequestBody } from '../middlewares/validation.middleware'; // Use the correct export
import { createVariantSchema, updateVariantSchema } from '../validations/productVariant.validation';
// import { isAdmin, protect } from '../middlewares/auth.middleware'; // Assuming auth middleware

// Create a router that expects productId in the path
// This router will be mounted under /products/:productId/variants in index.ts or product.routes.ts
const router = express.Router({ mergeParams: true }); // Enable merging params from parent router

// --- Routes specific to variants of a product ---

// GET /products/:productId/variants - Get all variants for a product
router.get('/', variantController.getProductVariants);

// POST /products/:productId/variants - Create a new variant for this product
router.post(
    '/',
    // protect, // Add auth/admin middleware if needed
    // isAdmin,
    validateRequestBody(createVariantSchema),
    variantController.createVariantHandler
);

// --- Routes for a specific variant ---

// GET /products/:productId/variants/:variantId - Get a specific variant
// Note: productId might be redundant if variantId is globally unique, but kept for consistency
router.get('/:variantId', variantController.getVariant);

// PUT /products/:productId/variants/:variantId - Update a specific variant
router.put(
    '/:variantId',
    // protect, // Add auth/admin middleware if needed
    // isAdmin,
    validateRequestBody(updateVariantSchema),
    variantController.updateVariantHandler
);

// DELETE /products/:productId/variants/:variantId - Delete a specific variant
router.delete(
    '/:variantId',
    // protect, // Add auth/admin middleware if needed
    // isAdmin,
    variantController.deleteVariantHandler
);

export default router;
