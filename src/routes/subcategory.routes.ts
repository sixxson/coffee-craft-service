import { Router } from "express";
import {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subcategory.controller";

const router = Router();

router.get("/", getAllSubcategories);
router.post("/", createSubcategory);
router.get("/:id", getSubcategoryById);
router.put("/:id", updateSubcategory);
router.delete("/:id", deleteSubcategory);
export default router;
