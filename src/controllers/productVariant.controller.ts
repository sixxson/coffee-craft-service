import { Request, Response, RequestHandler } from "express";
import * as variantService from "../services/productVariant.service";

// Get all variants for a product
export const getProductVariants: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { productId } = req.params; // Get productId from route params
    if (!productId) {
        res.status(400).json({ error: "Product ID is required in the route path." });
        return;
    }
    const variants = await variantService.getVariantsByProductId(productId);
    res.json(variants);
  } catch (error: any) {
    console.error("Error fetching variants:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: "Failed to fetch variants", message: error.message });
  }
};

// Get a single variant by its ID
export const getVariant: RequestHandler = async (req, res): Promise<void> => {
  try {
    // productId might not be needed here if variantId is globally unique
    const { variantId } = req.params;
    const variant = await variantService.getVariantById(variantId);

    if (!variant) {
      res.status(404).json({ error: "Variant not found" });
      return;
    }

    res.json(variant);
  } catch (error: any) {
    console.error("Error fetching variant:", error);
    res.status(500).json({ error: "Failed to fetch variant", message: error.message });
  }
};

// Create a new variant for a product
export const createVariantHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { productId } = req.params; // Get productId from route params
     if (!productId) {
        res.status(400).json({ error: "Product ID is required in the route path." });
        return;
    }
    const variant = await variantService.createVariant(productId, req.body);
    res.status(201).json(variant);
  } catch (error: any) {
     console.error("Error creating variant:", error);
     const statusCode = error.statusCode || 400;
     res.status(statusCode).json({ error: "Failed to create variant", message: error.message });
  }
};

// Update an existing variant
export const updateVariantHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    // productId might not be strictly needed if variantId is unique, but can be used for verification
    const { variantId } = req.params;
    const variant = await variantService.updateVariant(variantId, req.body);

    if (!variant) {
      res.status(404).json({ error: "Variant not found" });
      return;
    }

    res.json(variant);
  } catch (error: any) {
    console.error("Error updating variant:", error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ error: "Failed to update variant", message: error.message });
  }
};

// Delete a variant
export const deleteVariantHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
     // productId might not be strictly needed if variantId is unique
    const { variantId } = req.params;
    const deletedVariant = await variantService.deleteVariant(variantId);

     if (!deletedVariant) {
      res.status(404).json({ error: "Variant not found" });
      return;
    }

    // Successfully deleted
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting variant:", error);
    const statusCode = error.statusCode || 400; // Use 409 for conflict
    res.status(statusCode).json({ error: "Failed to delete variant", message: error.message });
  }
};
