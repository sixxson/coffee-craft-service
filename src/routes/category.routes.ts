import express from "express";
import multer from "multer";
import {
  getCategories,
  getCategory,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  exportCategories,
  importCategories,
  downloadCategoryTemplate,
} from "../controllers/category.controller";
import { validateRequestBody } from "../middlewares/validation.middleware"; // Import validation middleware
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation"; // Import schemas

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the parent category, if any
 *         order:
 *           type: integer
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         _count:
 *           type: object
 *           properties:
 *             products:
 *               type: integer
 *               description: Number of products in this category
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         order:
 *           type: integer
 *           nullable: true
 */

// --- CRUD Routes ---

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Retrieve a list of categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, order]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: A list of categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 total:
 *                   type: integer
 */
router.get("/", getCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Retrieve a single category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the category to retrieve
 *     responses:
 *       200:
 *         description: Category details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */
router.get("/:id", getCategory);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: [] # Add appropriate security
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Conflict (e.g., duplicate name under same parent)
 */
router.post(
  "/",
  // authenticate, // Add middleware as needed
  // isStaffOrAdmin,
  validateRequestBody(createCategorySchema),
  createCategoryHandler
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update an existing category
 *     tags: [Categories]
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
 *         description: ID of the category to update
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
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               order:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Category updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *       409:
 *         description: Conflict (e.g., duplicate name)
 */
router.put(
  "/:id",
  // authenticate,
  // isStaffOrAdmin,
  validateRequestBody(updateCategorySchema),
  updateCategoryHandler
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
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
 *         description: ID of the category to delete
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *       409:
 *         description: Conflict (Cannot delete category with associated products or sub-categories)
 */
router.delete(
    "/:id",
    // authenticate,
    // isStaffOrAdmin,
    deleteCategoryHandler
);

// --- Excel Import/Export Routes ---

/**
 * @swagger
 * /categories/export:
 *   get:
 *     summary: Export categories to Excel
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file containing category data.
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
router.get("/export", /* authenticate, isStaffOrAdmin, */ exportCategories);

/**
 * @swagger
 * /categories/import:
 *   post:
 *     summary: Import categories from Excel file
 *     tags: [Categories]
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
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: No file uploaded or invalid file format.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    "/import",
    // authenticate,
    // isStaffOrAdmin,
    upload.single("file"),
    importCategories
);

/**
 * @swagger
 * /categories/template:
 *   get:
 *     summary: Download Excel template for importing categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Excel template file.
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/template", downloadCategoryTemplate);

export default router;
