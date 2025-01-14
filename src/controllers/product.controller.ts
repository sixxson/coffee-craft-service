import { Request, Response } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/product.service";

export const createProductHandler = async (req: Request, res: Response) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
};

export const getAllProductsHandler = async (_req: Request, res: Response) => {
  try {
    const products = await getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error getting products" });
  }
};

export const getProductByIdHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  const product = await getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.status(200).json(product);
};

export const updateProductHandler = async (req: Request, res: Response): Promise<any> => {
  const product = await updateProduct(req.params.id, req.body);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.status(200).json(product);
};

export const deleteProductHandler = async (req: Request, res: Response): Promise<any> => {
  const product = await deleteProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.status(200).json({ message: "Product deleted successfully" });
};
