import { Router } from "express";

import {
  deleteUser,
  getAllUsers,
  getUserById,
  login,
  register,
  updateUser,
} from "../controllers/user.controller";

const router = Router();

router.get("/", getAllUsers);
router.post("/register", register);
router.get("/login", login);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
