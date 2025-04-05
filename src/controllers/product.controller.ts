import { Request, Response, RequestHandler } from "express"; // Import RequestHandler
import * as productService from "../services/product.service";

export const getProducts: RequestHandler = async (req, res) => { // Add type
  try {
    const products = await productService.getAllProducts(req.query);
    const response = {
      data: products[0],
      total: products[1],
    };
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Excel Export ---
export const exportProducts: RequestHandler = async (req, res) => { // Add type
  try {
    const buffer = await productService.exportProductsToExcel();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=products.xlsx");

    res.send(buffer);
  } catch (error: any) {
    console.error("Error exporting products:", error);
    res.status(500).json({ error: "Failed to export products", message: error.message });
  }
};

// --- Excel Import ---
export const importProducts: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return; // Explicitly return void
    }
    if (!req.file.buffer) {
       res.status(400).json({ error: "Uploaded file buffer is missing" });
       return; // Explicitly return void
    }

    const result = await productService.importProductsFromExcel(req.file.buffer);

    res.json({
      message: `Import process completed. Successfully imported ${result.success} products.`,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("Error importing products:", error);
    // Distinguish between file processing errors and database errors if needed
    res.status(400).json({ error: "Failed to import products", message: error.message });
  }
};

// --- Template Download ---
export const downloadProductTemplate: RequestHandler = async (req, res) => { // Add type
  try {
    const buffer = await productService.downloadProductTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=product_template.xlsx"
    );

    res.send(buffer);
  } catch (error: any) {
    console.error("Error downloading product template:", error);
    res.status(500).json({ error: "Failed to download template", message: error.message });
  }
};

export const getProduct: RequestHandler = async (req, res) => { // Add type
  try {
    const product = await productService.getProductById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createProduct: RequestHandler = async (req, res) => { // Add type
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct: RequestHandler = async (req, res) => { // Add type
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct: RequestHandler = async (req, res) => { // Add type
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const getProductImages: RequestHandler = async (req, res) => { // Add type
  try {
    const images = await productService.getImages(req.query);
    res.json(images);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createProductImage: RequestHandler = async (req, res) => { // Add type
  try {
    await productService.createProductImage(req.body);
    res.json({ message: "Images uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProductImage: RequestHandler = async (req, res) => { // Add type
  try {
    await productService.deleteProductImage(req.params.id);
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProductImage: RequestHandler = async (req, res) => { // Add type
  try {
    await productService.updateProductImage(req.params.id, req.body);
    res.json({ message: "Image updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
