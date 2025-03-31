import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../utils/utils";
import * as bCrypt from "bcrypt";

const prisma = new PrismaClient({
  log: ["error"],
});

export const getUserById = async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (!userId) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
};

export const updateUser = async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (!userId) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  if (req.user?.role === "CUSTOMER" && userId !== req.user.id) {
    res
      .status(403)
      .json({ message: "Access forbidden, cannot update another user" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // Prepare update data from validated req.body
  const data: any = { ...req.body }; // Spread validated fields

  // Handle password hashing separately if present in validated data
  if (data.password) {
    if (req.user?.role === "CUSTOMER") {
      if (!data.oldPassword) {
        res.status(400).json({ message: "Old password is required" });
        return;
      }
      const passwordMatch = await bCrypt.compare(
        data.oldPassword,
        user.password
      );
      if (!passwordMatch) {
        res.status(401).json({ message: "Old password is incorrect" });
        return;
      }
    }
    data.password = await hashPassword(data.password);
  }

  // Remove fields that shouldn't be directly updated this way (e.g., email, role unless admin)
  // The updateUserProfileSchema already prevents role/email, but good practice if schemas change
  delete data.email;
  delete data.oldPassword;
  // Update user
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data, // Use the prepared data object
    });
    const { password, ...userWithoutPass } = updatedUser;
    res.json(userWithoutPass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (!userId) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  // Delete user
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    if ((error as any).code === "P2025") {
      // Prisma error code for record not found
      res.status(404).json({ message: "User not found" });
      return;
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(users);
};
