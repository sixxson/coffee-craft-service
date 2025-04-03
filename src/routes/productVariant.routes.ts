import express from 'express';
import * as variantController from '../controllers/productVariant.controller';
import { validateRequestBody } from '../middlewares/validation.middleware'; // Use the correct export
import { createVariantSchema, updateVariantSchema } from '../validations/productVariant.validation';
// import { isAdmin, protect } from '../middlewares/auth.middleware'; // Assuming auth middleware

// Create a router that expects productId in the path
// This router will be mounted under /products/:productId/variants in index.ts or product.routes.ts
const router = express.Router({ mergeParams: true }); // Enable merging params from parent router

/**
 * @swagger
 * tags:
 *   name: Product Variants
 *   description: Management of variants for specific products
 */

// Schemas ProductVariant and ProductVariantInput should be defined in product.routes.ts or globally

// --- Routes specific to variants of a product ---

/**
 * @swagger
 * /products/{productId}/variants:
 *   get:
 *     summary: Retrieve all variants for a specific product
 *     tags: [Product Variants]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the product whose variants are to be retrieved
 *     responses:
 *       200:
 *         description: A list of variants for the product.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductVariant'
 *       404:
 *         description: Product not found
 */
router.get('/', variantController.getProductVariants);

/**
 * @swagger
 * /products/{productId}/variants:
 *   post:
 *     summary: Create a new variant for a specific product
 *     tags: [Product Variants]
 *     security:
 *       - cookieAuth: [] # Add appropriate security
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the product to add a variant to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariantInput'
 *     responses:
 *       201:
 *         description: Variant created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Product not found }
 *       409: { description: Conflict (Duplicate SKU/Name for this product) }
 */
router.post(
    '/',
    // authenticate, // Add middleware as needed
    // isAdmin,
    validateRequestBody(createVariantSchema),
    variantController.createVariantHandler
);

// --- Routes for a specific variant ---

/**
 * @swagger
 * /products/{productId}/variants/{variantId}:
 *   get:
 *     summary: Retrieve a specific product variant by ID
 *     tags: [Product Variants]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the parent product
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the variant to retrieve
 *     responses:
 *       200:
 *         description: Variant details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       404:
 *         description: Variant not found (or product not found)
 */
router.get('/:variantId', variantController.getVariant);

/**
 * @swagger
 * /products/{productId}/variants/{variantId}:
 *   put:
 *     summary: Update an existing product variant
 *     tags: [Product Variants]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the parent product
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the variant to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object # Define properties based on UpdateVariantSchema
 *             properties:
 *               sku: { type: string, nullable: true }
 *               price: { type: number }
 *               discountPrice: { type: number, nullable: true }
 *               stock: { type: integer }
 *               name: { type: string }
 *               color: { type: string, nullable: true }
 *               weight: { type: string, nullable: true }
 *               material: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Variant updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Variant or Product not found }
 *       409: { description: Conflict (Duplicate SKU/Name) }
 */
router.put(
    '/:variantId',
    // authenticate,
    // isAdmin,
    validateRequestBody(updateVariantSchema),
    variantController.updateVariantHandler
);

/**
 * @swagger
 * /products/{productId}/variants/{variantId}:
 *   delete:
 *     summary: Delete a product variant
 *     tags: [Product Variants]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the parent product
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the variant to delete
 *     responses:
 *       204: { description: Variant deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Variant or Product not found }
 *       409: { description: Conflict (e.g., variant used in orders) }
 */
router.delete(
    '/:variantId',
    // authenticate,
    // isAdmin,
    variantController.deleteVariantHandler
);

export default router;
