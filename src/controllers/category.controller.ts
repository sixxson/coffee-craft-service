import { Request, Response } from "express";
import cloudinary from "../config/cloudinary.config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await prisma.category.findMany();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products" });
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving product" });
  }
};

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;
    const newCategory = await prisma.category.create({
      data: { name, description },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existingCategory) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
      },
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating Category" });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting category" });
  }
};
