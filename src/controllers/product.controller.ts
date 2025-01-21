import { Request, Response } from "express";
import cloudinary from "../config/cloudinary.config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
      },
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products" });
  }
};

export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { images: true }, // Bao gồm ảnh
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving product" });
  }
};

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, price, stock, categoryId } = req.body;
    const newProduct = await prisma.product.create({
      data: { name, description, price, stock, categoryId },
    });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
};

export const uploadProductImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { type } = req.body;
    const file = req.file?.path;

    if (!file) {
      res.status(400).json({ message: "No file uploaded." });
      return;
    }

    const uploadResult = await cloudinary.uploader.upload(file, {
      folder: "coffee-craft",
      transformation:
        type === "thumbnail"
          ? [{ width: 500, height: 500, crop: "fill" }] // Resize if thumbnail
          : undefined, // Không resize nếu là detail
    });

    const newImage = await prisma.productImage.create({
      data: {
        productId: Number(productId),
        url: uploadResult.secure_url,
        type,
      },
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading product image." });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
      },
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product" });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Xóa tất cả ảnh liên quan
    await prisma.productImage.deleteMany({
      where: { productId: Number(id) },
    });

    // Xóa sản phẩm
    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
};

export const deleteProductImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { type } = req.body;

    // Validate type
    if (!["thumbnail", "detail"].includes(type)) {
      res
        .status(400)
        .json({
          message: "Invalid image type. Allowed values: 'thumbnail', 'detail'.",
        });
      return;
    }

    const images = await prisma.productImage.findMany({
      where: { productId: Number(productId), type },
    });

    if (images.length === 0) {
      res
        .status(404)
        .json({ message: `No ${type} images found for this product.` });
      return;
    }

    await Promise.all(
      images.map(async (image) => {
        const publicId = image.url.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        }

        await prisma.productImage.delete({
          where: { id: image.id },
        });
      })
    );

    res
      .status(200)
      .json({
        message: `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } images deleted successfully.`,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product images" });
  }
};
