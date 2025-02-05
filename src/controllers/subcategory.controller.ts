import { Request, Response } from "express";
import cloudinary from "../config/cloudinary.config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const getAllSubcategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await prisma.subcategory.findMany();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products" });
  }
};

export const getSubcategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: Number(id) },
    });

    if (!subcategory) {
      res.status(404).json({ message: "Subcategory not found" });
      return;
    }

    res.status(200).json(subcategory);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving product" });
  }
};

export const createSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, categoryId } = req.body;
    const newSubcategory = await prisma.subcategory.create({
      data: { name, categoryId },
    });

    res.status(201).json(newSubcategory);
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
};

export const updateSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, categoryId } = req.body;

    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id: Number(id) },
    });

    if (!existingSubcategory) {
      res.status(404).json({ message: "Subcategory not found" });
      return;
    }

    const updatedSubcategory = await prisma.subcategory.update({
      where: { id: Number(id) },
      data: {
        name,
        categoryId,
      },
    });

    res.status(200).json(updatedSubcategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating Subcategory" });
  }
};

export const deleteSubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.subcategory.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting subcategory" });
  }
};
