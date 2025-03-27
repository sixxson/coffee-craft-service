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

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Basic CRUD routes - Consider adding authentication/authorization middleware here
router.get("/", getBrands as express.RequestHandler);
router.get("/:id", getBrand as express.RequestHandler); // Optional: Add param validation
router.post(
  "/",
  validateRequestBody(createBrandSchema),
  createBrandHandler as express.RequestHandler
);
router.put(
  "/:id",
  validateRequestBody(updateBrandSchema),
  updateBrandHandler as express.RequestHandler
);
router.delete("/:id", deleteBrandHandler as express.RequestHandler); // Optional: Add param validation

// Excel import/export routes - Consider adding authentication/authorization middleware here
router.get("/export", exportBrands);
router.post(
  "/import",
  upload.single("file"),
  importBrands as express.RequestHandler
);

// Add this route to brand.routes.ts
router.get("/template", downloadBrandTemplate);

export default router;
