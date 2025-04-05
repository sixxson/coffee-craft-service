import express from "express";
import multer from "multer";
import {
  getBrands,
  getBrand,
  createBrandHandler,
  updateBrandHandler,
  deleteBrandHandler,
  exportBrands,
  importBrands,
  downloadBrandTemplate,
} from "../controllers/brand.controller";
import { validateRequestBody } from "../middlewares/validation.middleware";
import {
  createBrandSchema,
  updateBrandSchema,
} from "../validations/brand.validation";
import { authenticate, isStaffOrAdmin } from "../middlewares/auth.middleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Brand management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the brand
 *         name:
 *           type: string
 *           description: Name of the brand
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional description for the brand
 *         order:
 *           type: integer
 *           nullable: true
 *           description: Optional sorting order
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *         _count:
 *           type: object
 *           properties:
 *             products:
 *               type: integer
 *               description: Number of products associated with this brand
 *     BrandInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         order:
 *           type: integer
 *           nullable: true
 */

// --- Excel Import/Export Routes ---

/**
 * @swagger
 * /brands/export:
 *   get:
 *     summary: Export brands to Excel
 *     tags: [Brands]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file containing brand data.
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/export", authenticate, isStaffOrAdmin, exportBrands);

/**
 * @swagger
 * /brands/import:
 *   post:
 *     summary: Import brands from Excel file
 *     tags: [Brands]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx) to import.
 *     responses:
 *       200:
 *         description: Import process summary.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: integer
 *                   description: Number of brands successfully imported.
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of errors encountered during import.
 *       400:
 *         description: No file uploaded or invalid file format.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/import",
  authenticate,
  isStaffOrAdmin,
  upload.single("file"),
  importBrands as express.RequestHandler
);

/**
 * @swagger
 * /brands/template:
 *   get:
 *     summary: Download Excel template for importing brands
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Excel template file.
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/template", downloadBrandTemplate);

// --- CRUD Routes ---

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Retrieve a list of brands
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, order]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of brands.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Brand'
 *                 total:
 *                   type: integer
 */
router.get("/", getBrands as express.RequestHandler);

/**
 * @swagger
 * /brands/{id}:
 *   get:
 *     summary: Retrieve a single brand by ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the brand to retrieve
 *     responses:
 *       200:
 *         description: Brand details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       404:
 *         description: Brand not found
 */
router.get("/:id", getBrand as express.RequestHandler);

/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
 *     security:
 *       - cookieAuth: [] # Add appropriate security based on your setup
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BrandInput'
 *     responses:
 *       201:
 *         description: Brand created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User lacks permission)
 *       409:
 *         description: Conflict (e.g., duplicate name)
 */
router.post(
  "/",
  // authenticate, // Add middleware as needed
  // isStaffOrAdmin,
  validateRequestBody(createBrandSchema),
  createBrandHandler as express.RequestHandler
);

/**
 * @swagger
 * /brands/{id}:
 *   put:
 *     summary: Update an existing brand
 *     tags: [Brands]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the brand to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               order:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Brand updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Brand not found
 *       409:
 *         description: Conflict (e.g., duplicate name)
 */
router.put(
  "/:id",
  // authenticate,
  // isStaffOrAdmin,
  validateRequestBody(updateBrandSchema),
  updateBrandHandler as express.RequestHandler
);

/**
 * @swagger
 * /brands/{id}:
 *   delete:
 *     summary: Delete a brand
 *     tags: [Brands]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the brand to delete
 *     responses:
 *       204:
 *         description: Brand deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Brand not found
 */
router.delete(
  "/:id",
  // authenticate,
  // isStaffOrAdmin,
  deleteBrandHandler as express.RequestHandler
);
export default router;
