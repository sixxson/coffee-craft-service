import { Request, Response } from "express";
import cloudinary from "../config/cloudinary.config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const getAllBrands = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await prisma.brand.findMany();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products" });
  }
};

export const getBrandById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({
      where: { id: Number(id) },
    });

    if (!brand) {
      res.status(404).json({ message: "Brand not found" });
      return;
    }

    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving product" });
  }
};

export const createBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, categoryId } = req.body;
    const newBrand = await prisma.brand.create({
      data: { name, categoryId },
    });

    res.status(201).json(newBrand);
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
};

export const updateBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, categoryId } = req.body;

    const existingBrand = await prisma.brand.findUnique({
      where: { id: Number(id) },
    });

    if (!existingBrand) {
      res.status(404).json({ message: "Brand not found" });
      return;
    }

    const updatedBrand = await prisma.brand.update({
      where: { id: Number(id) },
      data: {
        name,
        categoryId,
      },
    });

    res.status(200).json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: "Error updating Brand" });
  }
};

export const deleteBrand = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.brand.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting brand" });
  }
};
