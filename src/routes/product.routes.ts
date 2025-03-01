import productController, {
  createProduct,
  getAllProducts,
  getProductById,
  // updateProduct,
  deleteProduct,
  // uploadProductImage,
  // deleteProductImage,
} from "../controllers/product.controller";
import multer from "multer";
import { RequestHandler } from "express";
// import { jwtCheck, jwtParse } from "../middlewares/auth.middleware";
import express from "express";
import { validateProductRequest } from "../middlewares/validateProduct.middleware";
import authenticate from "../middlewares/auth.middleware";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5mb
  },
});

router.get("/", getAllProducts);
router.get("/:id", getProductById);
// router.post(
//   "/:productId/image",
//   upload.single("image"),
//   validateProductImage,
//   uploadProductImage
// );

router.post(
  "/",
  authenticate,
  // validateProductRequest,
  productController.createProduct
);
// router.put("/:id", jwtCheck, jwtParse, validateProductRequest, productController.updateProduct);
// router.delete("/:id", jwtCheck, jwtParse, deleteProduct);
// router.delete("/:productId/image", deleteProductImage);

export default router;
