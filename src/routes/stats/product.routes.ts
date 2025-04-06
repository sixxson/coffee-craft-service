import express from 'express';
import { validateRequestQuery } from '../../middlewares/validation.middleware';
import productValidation from '../../validations/stats/product.validation';
import productController from '../../controllers/stats/product.controller'; // Default import is correct here as the controller exports an object as default
import { authenticate, isStaffOrAdmin } from '../../middlewares/auth.middleware';
import { UserRole } from '@prisma/client'; // Although not directly used here, good practice if needed later

const router = express.Router();

// Apply authentication and authorization (e.g., only STAFF and ADMIN) to all product stat routes
router.use(authenticate, isStaffOrAdmin);

/**
 * @swagger
 * tags:
 *   name: Statistics - Products
 *   description: API endpoints for product statistics (Requires STAFF or ADMIN role)
 */

/**
 * @swagger
 * /stats/products/top-selling:
 *   get:
 *     summary: Get top selling products by quantity or revenue
 *     tags: [Statistics - Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [quantity, revenue]
 *           default: quantity
 *         description: Criterion to sort products by.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of products to return.
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional. Filter by category ID.
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional. Filter by brand ID.
 *     responses:
 *       200:
 *         description: Successful retrieval of top selling products.
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
 *                 sortBy:
 *                   type: string
 *                   enum: [quantity, revenue]
 *                 limit:
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
 *                       totalQuantitySold:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 *                         format: double
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
    '/top-selling',
    validateRequestQuery(productValidation.getTopSellingProducts.query),
    productController.getTopSellingProducts
);

/**
 * @swagger
 * /stats/products/performance:
 *   get:
 *     summary: Get product performance grouped by category or brand
 *     tags: [Statistics - Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         required: true
 *         schema:
 *           type: string
 *           enum: [category, brand]
 *         description: Group performance data by 'category' or 'brand'.
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *     responses:
 *       200:
 *         description: Successful retrieval of performance data.
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
 *                   enum: [category, brand]
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: ID of the category or brand.
 *                       name:
 *                         type: string
 *                         description: Name of the category or brand.
 *                       totalQuantitySold:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 *                         format: double
 *       400:
 *         description: Invalid query parameters (e.g., missing groupBy).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
    '/performance',
    validateRequestQuery(productValidation.getProductPerformance.query),
    productController.getProductPerformance
);

/**
 * @swagger
 * /stats/products/inventory:
 *   get:
 *     summary: Get inventory statistics (low stock, total value)
 *     tags: [Statistics - Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: lowStockThreshold
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 10
 *         description: Threshold below which stock is considered low.
 *     responses:
 *       200:
 *         description: Successful retrieval of inventory statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lowStockThreshold:
 *                   type: integer
 *                   description: The threshold used for the 'lowStockProducts' list.
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                       description: Total number of active products being tracked.
 *                     productsInStock:
 *                       type: integer
 *                       description: Count of products with stock > 0.
 *                     productsLowStock:
 *                       type: integer
 *                       description: Count of products with 0 < stock <= lowStockThreshold.
 *                     productsOutOfStock:
 *                       type: integer
 *                       description: Count of products with stock = 0.
 *                     totalInventoryValue:
 *                       type: number
 *                       format: double
 *                       description: Sum(product.price * product.stock) for products with stock > 0.
 *                 lowStockProducts:
 *                   type: array
 *                   description: List of products with 0 < stock <= lowStockThreshold.
 *                   items:
 *                     $ref: '#/components/schemas/InventoryProductInfo'
 *                 outOfStockProducts:
 *                   type: array
 *                   description: List of products with stock = 0.
 *                   items:
 *                     $ref: '#/components/schemas/InventoryProductInfo'
 * components: # Add this section if it doesn't exist at the root level of your Swagger spec
 *   schemas:
 *     InventoryProductInfo:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         sku:
 *           type: string
 *         stock:
 *           type: integer
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
    '/inventory',
    validateRequestQuery(productValidation.getProductInventory.query),
    productController.getProductInventory
);

/**
 * @swagger
 * /stats/products/variants/performance:
 *   get:
 *     summary: Get performance statistics for variants of a specific product
 *     tags: [Statistics - Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the product whose variants to analyze.
 *       - $ref: '#/components/parameters/periodQueryParam'
 *       - $ref: '#/components/parameters/startDateQueryParam'
 *       - $ref: '#/components/parameters/endDateQueryParam'
 *     responses:
 *       200:
 *         description: Successful retrieval of variant performance data.
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
 *                 productId:
 *                   type: string
 *                   format: uuid
 *                 productName:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       variantId:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         description: Name of the variant.
 *                       sku:
 *                         type: string
 *                         nullable: true
 *                       totalQuantitySold:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 *                         format: double
 *       400:
 *         description: Invalid query parameters (e.g., missing productId).
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.get(
    '/variants/performance', // Route path as per plan
    validateRequestQuery(productValidation.getProductVariantPerformance.query),
    productController.getProductVariantPerformance
);


export default router;