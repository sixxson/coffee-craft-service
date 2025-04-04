import { UploadedFile } from "express-fileupload";
import cloudinary from "cloudinary";
import { PrismaClient } from "@prisma/client";
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
    page = 1,
    limit = 100,
    sortBy,
    sortOrder = "desc",
    categoryId,
    brandId,
    minPrice,
    maxPrice,
  } = options;

  const where: any = {
    categoryId,
    brandId,
    price: {
      ...(minPrice && { gte: parseFloat(minPrice) }),
      ...(maxPrice && { lte: parseFloat(maxPrice) }),
    },
  };
  for (let key in where) {
    if (where[key] === undefined) {
      delete where[key];
    }
  }
  return await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        images: true, // Keep one instance
        tags: true, // Include tags
        variants: true, // Include variants
        // orderItems: true, // Maybe not needed for general product list? Keep if necessary.
      },
      orderBy:
        sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);
}

// Function to get a product by ID with images
async function getProductById(id: string): Promise<any | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true, // Already included
      category: true,
      brand: true,
      tags: true, // Include tags
      variants: true, // Include variants
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
  console.log("🚀 ~ getImages ~ productId:", productId)
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
};
