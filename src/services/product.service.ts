import { UploadedFile } from "express-fileupload";
import cloudinary from "cloudinary";
import { PrismaClient, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { Decimal } from "@prisma/client/runtime/library";
// Import both helpers
import {
  processIdFilterInput,
  parsePaginationAndSorting,
} from "../utils/utils";

const prisma = new PrismaClient();

// Function to upload an image to Cloudinary
async function uploadImage(file: UploadedFile) {
  return await cloudinary.v2.uploader.upload(file.tempFilePath, {
    eager: [
      { width: 200, height: 200, crop: "fill", gravity: "center" },
      { width: 800, height: 600, crop: "fill", gravity: "center" },
    ],
  });
}

// Function to get all products with images
async function getAllProducts(options: any): Promise<any[]> {
  const {
    categoryId,
    brandId,
    minPrice,
    maxPrice,
  } = options;

  // Use helper for pagination and sorting
  const { skip, take, orderBy } = parsePaginationAndSorting(options);

  // Build the where clause dynamically
  const where: Prisma.ProductWhereInput = {};

  // Use helper function for Category ID filter
  const categoryFilter = processIdFilterInput(categoryId);
  if (categoryFilter) {
    // categoryId is non-nullable string, so cast the result to StringFilter
    where.categoryId = categoryFilter as Prisma.StringFilter;
  }

  // Use helper function for Brand ID filter
  const brandFilter = processIdFilterInput(brandId);
  if (brandFilter) {
    // brandId is non-nullable string, so cast the result to StringFilter
    where.brandId = brandFilter as Prisma.StringFilter;
  }

  // Handle Price filter (price is non-nullable Decimal)
  const priceFilter: Prisma.DecimalFilter = {}; // Use DecimalFilter
  if (minPrice != null) {
    try {
      priceFilter.gte = new Decimal(minPrice);
    } catch (e) {
      console.error(
        "Invalid minPrice format:",
        minPrice
      ); /* Consider throwing error */
    }
  }
  if (maxPrice != null) {
    try {
      priceFilter.lte = new Decimal(maxPrice);
    } catch (e) {
      console.error(
        "Invalid maxPrice format:",
        maxPrice
      ); /* Consider throwing error */
    }
  }
  if (Object.keys(priceFilter).length > 0) {
    where.price = priceFilter;
  }

  // Fetch products and count
  const findManyArgs: Prisma.ProductFindManyArgs = {
    where,
    skip, // Use value from helper
    take, // Use value from helper
    include: {
      images: true,
      category: { select: { name: true } },
      brand: { select: { name: true } },
      tags: true,
      variants: true,
    },
    orderBy, // Use value from helper
  };
  // Execute queries
  const [products, totalCount] = await prisma.$transaction([
    prisma.product.findMany(findManyArgs),
    prisma.product.count({ where }),
  ]);

  return [products, totalCount]; // Return tuple as before
}

// Function to get a product by ID with images
async function getProductById(id: string): Promise<any | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      category: {
        select: {
          name: true,
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
      tags: true,
      variants: true,
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              imgUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
}

// Function to create a new product with relations
async function createProduct(data: any): Promise<any> {
  const { images, tags, variants, categoryId, brandId, ...productData } = data;

  // Prepare nested writes for relations
  const imageData =
    images?.map((img: any, index: number) => ({
      url: img.url,
      order: img.order ?? index,
      isThumbnail: img.isThumbnail ?? false,
    })) || [];

  const tagData =
    tags?.map((tagName: string) => ({
      where: { name: tagName },
      create: { name: tagName },
    })) || [];

  const variantData =
    variants?.map((variant: any) => ({
      sku: variant.sku,
      price: variant.price,
      discountPrice: variant.discountPrice,
      stock: variant.stock,
      name: variant.name,
      color: variant.color,
      weight: variant.weight,
      material: variant.material,
    })) || [];

  const createdProduct = await prisma.product.create({
    data: {
      ...productData, // sku, name, shortDescription, longDescription, price, discountPrice, stock, active
      category: { connect: { id: categoryId } },
      brand: brandId ? { connect: { id: brandId } } : undefined,
      images: {
        create: imageData,
      },
      tags: {
        connectOrCreate: tagData,
      },
      variants: {
        create: variantData,
      },
    },
    include: {
      // Include relations in the returned object
      images: true,
      category: true,
      brand: true,
      tags: true,
      variants: true,
    },
  });

  return createdProduct;
}

// Function to update a product with relations
async function updateProduct(id: string, data: any): Promise<any | null> {
  const { images, tags, variants, categoryId, brandId, ...productData } = data;

  // --- Prepare updates for relations ---

  // Tags: Use 'set' to replace existing tags with the new list
  const tagConnections =
    tags?.map((tagName: string) => ({
      where: { name: tagName },
      create: { name: tagName },
    })) || [];

  // Variants & Images: More complex updates (create/update/delete) might require transactions
  // or separate logic. For simplicity here, we'll focus on updating the product data
  // and setting tags. Full variant/image updates within this single call can be complex.
  // A common pattern is to handle variant/image updates via dedicated endpoints or
  // by fetching the product, calculating diffs, and performing specific create/update/delete operations.

  // Example: Basic update focusing on product data and tags
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...productData, // Update direct fields
      categoryId: categoryId, // Update category if provided
      brandId: brandId, // Update brand if provided
      tags: tags ? { set: [], connectOrCreate: tagConnections } : undefined, // Replace tags
      // Handling variants and images updates here requires more logic (omitted for brevity)
      // You might need to:
      // 1. Delete variants/images not in the new list.
      // 2. Update existing ones.
      // 3. Create new ones.
      // This often involves prisma.$transaction([...])
    },
    include: {
      // Include relations in the returned object
      images: true,
      category: true,
      brand: true,
      tags: true,
      variants: true,
    },
  });

  if (!updatedProduct) {
    throw new Error("Product not found or update failed");
  }
  return updatedProduct;
}

// Function to delete a product and its images
async function deleteProduct(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });

  if (!product) {
    return;
  }

  const imageDeletionPromises = product.images.map(({ id: imageId }) =>
    prisma.productImage.delete({ where: { id: imageId } })
  );

  await Promise.all(imageDeletionPromises);
  const deletedProduct = await prisma.product.delete({
    where: { id: productId },
  });
  if (!deletedProduct) {
    throw new Error("Product not found");
  }
}
async function getImages(options: any): Promise<any> {
  const { productId } = options;
  return await prisma.productImage.findMany({
    where: productId ? { productId } : {},
  });
}

async function createProductImage(images: any): Promise<void> {
  if (!images?.length) {
    throw new Error("At least one image is required");
  }

  const imagePromises = images.map(async (image: any, index: number) => {
    return prisma.productImage.create({
      data: {
        productId: image.productId,
        id: image.id || undefined,
        url: image.url,
        order: image?.order || index,
        isThumbnail: image?.isThumbnail || false,
      },
    });
  });
  await Promise.all(imagePromises);
}

async function deleteProductImage(imageId: string): Promise<void> {
  const deletedImage = await prisma.productImage.delete({
    where: { id: imageId },
  });
  if (!deletedImage) {
    throw new Error("Product image not found");
  }
}

async function updateProductImage(imageId: string, data: any): Promise<void> {
  const { order, isThumbnail, url, productId } = data;

  if (!imageId) throw new Error("Image ID is required");

  if (isThumbnail) {
    await prisma.productImage.updateMany({
      where: { productId: productId, id: { not: imageId } },
      data: {
        isThumbnail: false,
      },
    });
  }

  await prisma.productImage.update({
    where: { id: imageId },
    data: {
      order: order,
      isThumbnail: isThumbnail,
      url: url,
    },
  });
}

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getImages,
  createProductImage,
  deleteProductImage,
  updateProductImage,
  exportProductsToExcel, // Add new exports
  importProductsFromExcel,
  downloadProductTemplate,
};

// --- Excel Import/Export Functions ---

// Function to export products to Excel
async function exportProductsToExcel(): Promise<Buffer> {
  const products = await prisma.product.findMany({
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      tags: { select: { name: true } },
      // variants: true, // Exporting variants might make the sheet complex, omitting for now
    },
    orderBy: { createdAt: "desc" },
  });

  const excelData = products.map((product) => ({
    ID: product.id,
    SKU: product.sku,
    Name: product.name,
    Category: product.category.name,
    Brand: product.brand?.name || "",
    Price: product.price.toNumber(), // Convert Decimal to number
    DiscountPrice: product.discountPrice?.toNumber() || "",
    Stock: product.stock,
    Active: product.active,
    AvgRating: product.avgRating,
    ShortDescription: product.shortDescription || "",
    LongDescription: product.longDescription || "",
    Tags: product.tags.map((t) => t.name).join(", "), // Comma-separated tags
    CreatedAt: product.createdAt,
    UpdatedAt: product.updatedAt,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Optional: Set column widths
  worksheet["!cols"] = [
    { wch: 38 }, // ID
    { wch: 15 }, // SKU
    { wch: 40 }, // Name
    { wch: 20 }, // Category
    { wch: 20 }, // Brand
    { wch: 10 }, // Price
    { wch: 15 }, // DiscountPrice
    { wch: 8 }, // Stock
    { wch: 8 }, // Active
    { wch: 10 }, // AvgRating
    { wch: 50 }, // ShortDescription
    { wch: 80 }, // LongDescription
    { wch: 30 }, // Tags
    { wch: 20 }, // CreatedAt
    { wch: 20 }, // UpdatedAt
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

// Interface for expected row structure in Excel import
interface ProductRow {
  SKU: string;
  Name: string;
  CategoryName: string; // Use Name to find ID
  BrandName?: string; // Use Name to find ID
  Price: number;
  Stock: number;
  DiscountPrice?: number;
  ShortDescription?: string;
  LongDescription?: string;
  Active?: boolean | string; // Allow string 'true'/'false'
  Tags?: string; // Comma-separated tags
}

// Function to import products from Excel
async function importProductsFromExcel(
  fileBuffer: Buffer
): Promise<{ success: number; errors: string[] }> {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  // Use { raw: false } to attempt date parsing, { defval: null } to handle empty cells
  const data = XLSX.utils.sheet_to_json<ProductRow>(worksheet, {
    raw: false,
    defval: null,
  });

  const errors: string[] = [];
  let successCount = 0;

  // Fetch existing categories and brands for efficient lookup
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const categoryMap = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id])
  );
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
  });
  const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowIndex = i + 2; // Excel row number (1-based, +1 for header)

    try {
      // --- Basic Validation ---
      if (
        !row.SKU ||
        !row.Name ||
        !row.CategoryName ||
        row.Price == null ||
        row.Stock == null
      ) {
        errors.push(
          `Row ${rowIndex}: Missing required fields (SKU, Name, CategoryName, Price, Stock).`
        );
        continue;
      }

      // --- Find Relations ---
      const categoryId = categoryMap.get(row.CategoryName.toLowerCase());
      if (!categoryId) {
        errors.push(
          `Row ${rowIndex}: Category "${row.CategoryName}" not found.`
        );
        continue;
      }
      let brandId: string | undefined = undefined;
      if (row.BrandName) {
        brandId = brandMap.get(row.BrandName.toLowerCase());
        if (!brandId) {
          errors.push(`Row ${rowIndex}: Brand "${row.BrandName}" not found.`);
          continue;
        }
      }

      // --- Prepare Data ---
      const productInput: Prisma.ProductCreateInput = {
        sku: row.SKU,
        name: row.Name,
        category: { connect: { id: categoryId } },
        brand: brandId ? { connect: { id: brandId } } : undefined,
        price: new Decimal(row.Price),
        stock: Number(row.Stock),
        discountPrice:
          row.DiscountPrice != null
            ? new Decimal(row.DiscountPrice)
            : undefined,
        shortDescription: row.ShortDescription || null,
        longDescription: row.LongDescription || null,
        active:
          row.Active === undefined ||
          String(row.Active).toLowerCase() === "true", // Default to true
      };

      // Handle Tags (Connect or Create)
      const tagNames = row.Tags
        ? row.Tags.split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      if (tagNames.length > 0) {
        productInput.tags = {
          connectOrCreate: tagNames.map((name) => ({
            where: { name },
            create: { name },
          })),
        };
      }

      // --- Upsert Product (Update if SKU exists, Create if not) ---
      await prisma.product.upsert({
        where: { sku: row.SKU }, // Unique identifier to find existing product
        update: {
          // Data to use if product is found
          ...productInput, // Apply all prepared data, overwriting existing fields
          // Note: We might want to exclude certain fields from update, e.g., createdAt
          // Or handle relations differently on update (e.g., connect only, not connectOrCreate for tags)
          // For simplicity, this example updates all provided fields.
          tags: productInput.tags, // Ensure tags are updated/set correctly
        },
        create: {
          // Data to use if product is NOT found
          ...productInput,
        },
      });
      successCount++;
    } catch (error: any) {
      let errorMessage = `Row ${rowIndex}: ${error.message || "Unknown error"}`;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Check if target exists and contains 'sku' (safer type check)
        const target = error.meta?.target;
        if (
          error.code === "P2002" &&
          target &&
          ((Array.isArray(target) && target.includes("sku")) ||
            (typeof target === "string" && target.includes("sku")))
        ) {
          errorMessage = `Row ${rowIndex}: SKU "${row.SKU}" already exists.`;
        }
        // Add more specific Prisma error handling if needed (e.g., P2003 foreign key constraint)
      } else if (
        error instanceof Error &&
        error.message.includes("Invalid Decimal")
      ) {
        errorMessage = `Row ${rowIndex}: Invalid number format for Price, DiscountPrice, or Stock.`;
      }
      errors.push(errorMessage);
    }
  }

  return { success: successCount, errors };
}

// Function to download a template Excel file for products
async function downloadProductTemplate(): Promise<Buffer> {
  const templateData: ProductRow[] = [
    {
      SKU: "SKU001",
      Name: "Example Product",
      CategoryName: "Example Category Name", // Must match an existing category name
      BrandName: "Example Brand Name", // Optional, must match existing brand name if provided
      Price: 19.99,
      Stock: 100,
      DiscountPrice: 15.99, // Optional
      ShortDescription: "A short description.", // Optional
      LongDescription: "A longer description providing more details.", // Optional
      Active: true, // Optional (true/false)
      Tags: "tag1, tag2, example tag", // Optional, comma-separated
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Optional: Set column widths (match export widths if desired)
  worksheet["!cols"] = [
    { wch: 15 }, // SKU
    { wch: 40 }, // Name
    { wch: 25 }, // CategoryName
    { wch: 25 }, // BrandName
    { wch: 10 }, // Price
    { wch: 8 }, // Stock
    { wch: 15 }, // DiscountPrice
    { wch: 50 }, // ShortDescription
    { wch: 80 }, // LongDescription
    { wch: 8 }, // Active
    { wch: 30 }, // Tags
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
