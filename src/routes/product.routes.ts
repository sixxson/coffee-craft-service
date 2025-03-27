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

const router = express.Router();

router.get("/image", productController.getProductImages);
router.post("/image", productController.createProductImage);
router.put("/image/:id", productController.updateProductImage);
router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);
router.post(
  "/",
  // authenticate, // Consider uncommenting
  // isAdmin, // Consider uncommenting
  validateRequestBody(createProductSchema), // Validate request body
  productController.createProduct
);
router.put(
  "/:id",
  // authenticate, // Consider uncommenting
  // isAdmin, // Consider uncommenting
  validateRequestBody(updateProductSchema), // Validate request body
  productController.updateProduct
);
router.delete(
  "/:id",
  errorHandler,
  //  authenticate,
  //  isAdmin,
  productController.deleteProduct
);

export default router;
