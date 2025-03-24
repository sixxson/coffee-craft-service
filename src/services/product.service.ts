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

// Function to delete an image from Cloudinary
async function deleteImage(imageId: string): Promise<void> {
    await cloudinary.v2.uploader.destroy(imageId);
}

// Function to get all products with images
async function getAllProducts(options: any): Promise<any[]> {
  const {
    page = 1,
    limit = 100,
    sortBy,
    order,
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
      take: limit,
      include: {
        images: true,
        category: true,
        brand: true,
      },
      orderBy: sortBy && order ? { [sortBy]: order } : undefined,
    }),
    prisma.product.count({ where }),
  ]);
}

// Function to get a product by ID with images
async function getProductById(id: string): Promise<any | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      category: true,
      brand: true,
    },
  });
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
}

// Function to create a new product
async function createProduct(data: any): Promise<any> {
  const product = await prisma.product.create({ data });
  return await getProductById(product.id); // This call is still redundant, but removing it would be a separate optimization.
}

// Function to update a product
async function updateProduct(id: string, data: any): Promise<any | null> {
    const updatedProduct = await prisma.product.update({ where: { id }, data});
    if(!updatedProduct) {
        throw new Error("Product not found");
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
    const deletedProduct = await prisma.product.delete({ where: { id: productId } });
    if (!deletedProduct){
        throw new Error("Product not found");
    }
}
async function getImages(options: any): Promise<any> {
    const { productId } = options;
    return await prisma.productImage.findMany({
        where: productId ? { productId } : {},
    });
}

async function createProductImage(query: any): Promise<void> {
  const { images, productId, isUpload } = query;

  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (!images?.length) {
    throw new Error("At least one image is required");
  }

  if (isUpload) {
    const imagePromises = images.map(async (file: any, index: number) => {
      const image = await uploadImage(file.file);
      return prisma.productImage.create({
        data: {
          productId: productId,
          id: image.public_id,
          url: image.url,
          order: file?.order || index,
          isThumbnail: file.isThumbnail,
        },
      });
    });
    await Promise.all(imagePromises);
  } else {
    const imagePromises = images.map(async (image: any, index: number) => {
      return prisma.productImage.create({
        data: {
          productId: productId,
          // id: image.id,
          url: image.url,
          order: image?.order || index,
          isThumbnail: image?.isThumbnail || false,
        },
      });
    });
    await Promise.all(imagePromises);
  }
}

async function deleteProductImage(imageId: string): Promise<void> {
    await deleteImage(imageId);
    const deletedImage = await prisma.productImage.delete({ where: { id: imageId } });
     if (!deletedImage) {
        throw new Error("Product image not found");
    }
}

async function updateImage(query: any): Promise<void> {
    const { order, isThumbnail, imageId } = query;
    const updatedImage = await prisma.productImage.update({
        where: { id: imageId },
        data: {
            order: order,
            isThumbnail: isThumbnail,
        },
    });
    if(!updatedImage){
        throw new Error("Product image not found")
    }
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
    updateImage,
};
