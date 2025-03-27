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

router.get("/", getCategories);
router.get("/:id", getCategory); // Optional: Add param validation
router.post(
  "/",
  validateRequestBody(createCategorySchema), // Validate request body on create
  createCategoryHandler
);
router.put(
  "/:id",
  validateRequestBody(updateCategorySchema), // Validate request body on update
  updateCategoryHandler
);
router.delete("/:id", deleteCategoryHandler); // Optional: Add param validation

// Excel import/export routes - Consider adding authentication/authorization middleware here
router.get("/export", exportCategories);
router.post("/import", upload.single("file"), importCategories);

router.get("/template", downloadCategoryTemplate);

export default router;
