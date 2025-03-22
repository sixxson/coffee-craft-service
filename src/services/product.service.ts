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
    ...(categoryId && { categoryId }),
    ...(brandId && { brandId }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      },
    }),
  };

  // return await prisma.product.findMany({
  //   where,
  //   skip: (page - 1) * limit,
  //   take: limit,
  //   include: {
  //     images: true,
  //     category: true,
  //     brand: true,
  //   },
  //   orderBy: sortBy && order ? [{ [sortBy]: order }] : undefined,
  // });
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
      orderBy: sortBy && order ? [{ [sortBy]: order }] : undefined,
    }),
    prisma.product.count({ where }),
  ]);
}

// Function to get a product by ID with images
async function getProductById(id: string): Promise<any | null> {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      category: true,
      brand: true,
    },
  });
}

// Function to create a new product with images
async function createProduct(data: any): Promise<any> {
  // if (!images?.length) {
  //   throw new Error("At least one image is required");
  // }

  const product = await prisma.product.create({ data });

  // const imagePromises = images.map(async (file, index) => {
  //   const image = await uploadImage(file.file);
  //   return prisma.productImage.create({
  //     data: {
  //       productId: product.id,
  //       id: image.public_id,
  //       url: image.url,
  //       order: index,
  //       isThumbnail: file.isThumbnail,
  //     },
  //   });
  // });

  // await Promise.all(imagePromises);

  return await getProductById(product.id);
}

// Function to update a product with images
async function updateProduct(id: string, data: any): Promise<any | null> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;

  // const existingImages = await prisma.productImage.findMany({
  //   where: { productId: id },
  // });
  // const imagesToKeep = existingImages
  //   .filter((img: any) => !imagesToDelete.includes(img.id))
  //   .map((img: any) => img.id);

  // if (newImages.length) {
  //   const uploadPromises = newImages.map(async (file) => {
  //     const image = await uploadImage(file);
  //     imagesToKeep.push(image.public_id);
  //     return prisma.productImage.create({
  //       data: {
  //         productId: id,
  //         id: image.public_id,
  //         url: image.url,
  //       },
  //     });
  //   });
  //   await Promise.all(uploadPromises);
  // }

  // if (!imagesToKeep.length) {
  //   throw new Error("At least one image is required");
  // }

  // if (!imagesToKeep.includes(mainImageId)) {
  //   throw new Error("Thumbnail image ID must be in the kept images");
  // }

  // const deletePromises = imagesToDelete.map(async (imageId) => {
  //   await deleteImage(imageId);
  //   return prisma.productImage.delete({ where: { id: imageId } });
  // });

  // await Promise.all([
  //   ...deletePromises,
  //   prisma.productImage.updateMany({
  //     where: { productId: id },
  //     data: { isThumbnail: false },
  //   }),
  //   prisma.productImage.update({
  //     where: { id: mainImageId },
  //     data: { isThumbnail: true },
  //   }),
  //   prisma.product.update({ where: { id }, data }),
  // ]);
  return await prisma.product.update({ where: { id }, data });
}

// Function to delete a product and its images
async function deleteProduct(id: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!product) return;

  product.images.forEach(async (image: any) => {
    // await deleteImage(image.id);
    await prisma.productImage.delete({ where: { id: image.id } });
  });

  await prisma.product.delete({ where: { id } });
}
async function getImages(options: any): Promise<any> {
  const { productId } = options;
  return await prisma.productImage.findMany({
    // where: productId && { productId },
  });
}

async function createProductImage(query: any): Promise<void> {
  const { images, productId, isUpload } = query;
  console.log("🚀 ~ createProductImage ~ query:", images, productId, isUpload);

  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (!images?.length) {
    throw new Error("At least one image is required");
  }
  if (isUpload) {
    const imagePromises = images.map(async (file: any, index: number) => {
      const image = await uploadImage(file.file);
      prisma.productImage.create({
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
    images.forEach(async (image: any, index: number) => {
      await prisma.productImage.create({
        data: {
          productId: productId,
          // id: image.id,
          url: image.url,
          order: image?.order || index,
          isThumbnail: image?.isThumbnail || false,
        },
      });
    });
  }
}

async function deleteProductImage(imageId: string): Promise<void> {
  deleteImage(imageId);
  await prisma.productImage.delete({ where: { id: imageId } });
}

async function updateImage(query: any): Promise<void> {
  const { order, isThumbnail, imageId } = query;
  await prisma.productImage.update({
    where: { id: imageId },
    data: {
      order: order,
      isThumbnail: isThumbnail,
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
  updateImage,
};
