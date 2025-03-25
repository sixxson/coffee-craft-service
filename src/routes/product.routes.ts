import express from "express";
import * as productController from "../controllers/product.controller";
import multer from "multer";
import { authenticate, isAdmin } from "../middlewares/auth.middleware";
import errorHandler from "../middlewares/errorHandler.middleware";

const router = express.Router();

router.get("/image", productController.getProductImages);
router.post("/image", productController.createProductImage);
router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);
router.post(
  "/",
  // authenticate,
  // isAdmin,
  productController.createProduct
);
router.put(
  "/:id",
  // authenticate,
  // isAdmin
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
