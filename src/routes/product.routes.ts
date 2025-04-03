import express from "express";
import * as productController from "../controllers/product.controller";
import multer from "multer";
import { authenticate, isAdmin } from "../middlewares/auth.middleware";
import errorHandler from "../middlewares/errorHandler.middleware";
import { validateRequestBody } from "../middlewares/validation.middleware";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validation";
import productVariantRouter from "./productVariant.routes"; // Import the variant router
// import reviewController from '../controllers/review.controller'; // Import review controller if adding nested route

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         url:
 *           type: string
 *           format: uri
 *         order:
 *           type: integer
 *           nullable: true
 *         isThumbnail:
 *           type: boolean
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sku:
 *           type: string
 *           nullable: true
 *         price:
 *           type: number
 *           format: float
 *         discountPrice:
 *           type: number
 *           format: float
 *           nullable: true
 *         stock:
 *           type: integer
 *         name:
 *           type: string
 *         color:
 *           type: string
 *           nullable: true
 *         weight:
 *           type: string
 *           nullable: true
 *         material:
 *           type: string
 *           nullable: true
 *     Tag: # Assuming Tag schema is defined elsewhere or simplified here
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         shortDescription:
 *           type: string
 *           nullable: true
 *         longDescription:
 *           type: string
 *           nullable: true
 *         price:
 *           type: number
 *           format: float
 *         discountPrice:
 *           type: number
 *           format: float
 *           nullable: true
 *         categoryId:
 *           type: string
 *           format: uuid
 *         brandId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         stock:
 *           type: integer
 *         active:
 *           type: boolean
 *         avgRating:
 *           type: number
 *           format: float
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         category: # Simplified Category object
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *         brand: # Simplified Brand object
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *     ProductImageInput:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *           format: uri
 *         order:
 *           type: integer
 *         isThumbnail:
 *           type: boolean
 *     ProductVariantInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *       properties:
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         sku:
 *           type: string
 *           nullable: true
 *         discountPrice:
 *           type: number
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         weight:
 *           type: string
 *           nullable: true
 *         material:
 *           type: string
 *           nullable: true
 *     CreateProductInput:
 *       type: object
 *       required:
 *         - sku
 *         - name
 *         - price
 *         - categoryId
 *         - stock # Required for base product if no variants
 *       properties:
 *         sku: { type: string }
 *         name: { type: string }
 *         price: { type: number }
 *         categoryId: { type: string, format: uuid }
 *         stock: { type: integer }
 *         shortDescription: { type: string, nullable: true }
 *         longDescription: { type: string, nullable: true }
 *         discountPrice: { type: number, nullable: true }
 *         brandId: { type: string, format: uuid, nullable: true }
 *         active: { type: boolean, default: true }
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImageInput'
 *         tags:
 *           type: array
 *           items: { type: string }
 *           description: Array of tag names
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariantInput'
 *     UpdateProductInput:
 *       type: object
 *       properties:
 *         sku: { type: string }
 *         name: { type: string }
 *         price: { type: number }
 *         categoryId: { type: string, format: uuid }
 *         stock: { type: integer }
 *         shortDescription: { type: string, nullable: true }
 *         longDescription: { type: string, nullable: true }
 *         discountPrice: { type: number, nullable: true }
 *         brandId: { type: string, format: uuid, nullable: true }
 *         active: { type: boolean }
 *         tags:
 *           type: array
 *           items: { type: string }
 *           description: Replaces existing tags for the product
 *         # Note: images and variants are typically updated via their own endpoints
 */


// --- Product CRUD Routes ---

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve a list of products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 } # Note default from code
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: 'desc' }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: brandId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: A list of products.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product' # Simplified version might be returned
 *                 total:
 *                   type: integer
 */
router.get("/", productController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Retrieve a single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the product to retrieve
 *     responses:
 *       200:
 *         description: Product details including relations.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get("/:id", productController.getProduct);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - cookieAuth: [] # Add appropriate security
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductInput'
 *     responses:
 *       201:
 *         description: Product created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Category or Brand not found }
 *       409: { description: Duplicate SKU }
 */
router.post(
  "/",
  // authenticate,
  // isAdmin,
  validateRequestBody(createProductSchema),
  productController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Product, Category or Brand not found }
 *       409: { description: Duplicate SKU }
 */
router.put(
  "/:id",
  // authenticate,
  // isAdmin,
  validateRequestBody(updateProductSchema),
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the product to delete
 *     responses:
 *       204: { description: Product deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Product not found }
 */
router.delete(
  "/:id",
  // authenticate, // Add middleware
  // isAdmin,
  errorHandler, // Keep error handler if needed after auth
  productController.deleteProduct
);


// --- Product Image Routes (Consider nesting under /:productId/images) ---

/**
 * @swagger
 * /products/image:
 *   get:
 *     summary: Get product images (likely needs filtering)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *         description: Filter images by product ID
 *     responses:
 *       200:
 *         description: List of product images.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductImage'
 */
router.get("/image", productController.getProductImages);

/**
 * @swagger
 * /products/image:
 *   post:
 *     summary: Create product image(s)
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array # Assuming batch creation is supported by controller
 *             items:
 *               type: object
 *               required: [productId, url]
 *               properties:
 *                 productId: { type: string, format: uuid }
 *                 url: { type: string, format: uri }
 *                 order: { type: integer }
 *                 isThumbnail: { type: boolean }
 *     responses:
 *       200: # Or 201 if returning created objects
 *         description: Images uploaded successfully.
 *       400: { description: Validation error or no images provided }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Product not found }
 */
router.post("/image", /* authenticate, isAdmin, */ productController.createProductImage);

/**
 * @swagger
 * /products/image/{id}:
 *   put:
 *     summary: Update a product image
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the image to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url: { type: string, format: uri }
 *               order: { type: integer }
 *               isThumbnail: { type: boolean }
 *               productId: { type: string, format: uuid, description: "Required if changing thumbnail status" }
 *     responses:
 *       200:
 *         description: Image updated successfully.
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Image or Product not found }
 */
router.put("/image/:id", /* authenticate, isAdmin, */ productController.updateProductImage);

/**
 * @swagger
 * /products/image/{id}:
 *   delete:
 *     summary: Delete a product image
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the image to delete
 *     responses:
 *       200: # Or 204
 *         description: Image deleted successfully.
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Image not found }
 */
router.delete("/image/:id", /* authenticate, isAdmin, */ productController.deleteProductImage);


// --- Nested Routes ---

// Mount the variant router under /:productId/variants
router.use("/:productId/variants", productVariantRouter);

// Mount the review router under /:productId/reviews (Example)
// router.use('/:productId/reviews', reviewController.getProductReviews); // Needs reviewController import


export default router;
