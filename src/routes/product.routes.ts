import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  // uploadProductImage,
  // deleteProductImage,
} from "../controllers/product.controller";
import multer from "multer";
import { validateProductImage } from "../middlewares/validateProductImage.middleware";

const upload = multer({ dest: "uploads/" }); // Temporary storage

const router = Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
// router.post(
//   "/:productId/image",
//   upload.single("image"),
//   validateProductImage,
//   uploadProductImage
// );
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
// router.delete("/:productId/image", deleteProductImage);
export default router;
