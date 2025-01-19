import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const validateProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
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

    // Lấy danh sách ảnh hiện có
    const existingImages = await prisma.productImage.findMany({
      where: { productId: Number(productId), type },
    });

    if (type === "thumbnail" && existingImages.length >= 1) {
      res
        .status(400)
        .json({ message: "A product can only have one thumbnail image." });
      return;
    }

    if (type === "detail" && existingImages.length >= 10) {
      res
        .status(400)
        .json({ message: "A product can have a maximum of 10 detail images." });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error validating product image." });
  }
};
