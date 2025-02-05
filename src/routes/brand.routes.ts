import { Router } from "express";
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller";

const router = Router();

router.get("/", getAllBrands);
router.post("/", createBrand);
router.get("/:id", getBrandById);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);
export default router;
