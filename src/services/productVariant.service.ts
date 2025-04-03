import { PrismaClient, ProductVariant } from "@prisma/client";

const prisma = new PrismaClient();

// Type for the data needed to create a variant (excluding productId from body)
type CreateVariantData = Omit<ProductVariant, 'id' | 'productId' | 'createdAt' | 'updatedAt'>;
// Type for the data needed to update a variant
type UpdateVariantData = Partial<CreateVariantData>;

// Function to get all variants for a specific product
export const getVariantsByProductId = async (productId: string): Promise<ProductVariant[]> => {
  // Verify product exists (optional, but good practice)
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw Object.assign(new Error(`Product with ID ${productId} not found.`), { statusCode: 404 });
  }

  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: {
      // Add default sorting if desired, e.g., by name or creation date
      createdAt: 'asc',
    },
  });
};

// Function to get a single variant by its ID
export const getVariantById = async (variantId: string): Promise<ProductVariant | null> => {
  return prisma.productVariant.findUnique({
    where: { id: variantId },
  });
};

// Function to create a new variant for a specific product
export const createVariant = async (productId: string, data: CreateVariantData): Promise<ProductVariant> => {
   // Verify product exists
   const product = await prisma.product.findUnique({ where: { id: productId } });
   if (!product) {
     throw Object.assign(new Error(`Product with ID ${productId} not found. Cannot add variant.`), { statusCode: 404 });
   }

   // Optional: Check for duplicate variant SKU within the same product if SKU is provided
   if (data.sku) {
       const existingSku = await prisma.productVariant.findFirst({
           where: { productId: productId, sku: data.sku }
       });
       if (existingSku) {
            throw Object.assign(new Error(`Variant with SKU "${data.sku}" already exists for this product.`), { statusCode: 409 });
       }
   }
   // Optional: Check for duplicate variant name within the same product
   const existingName = await prisma.productVariant.findFirst({
       where: { productId: productId, name: data.name }
   });
   if (existingName) {
       throw Object.assign(new Error(`Variant with name "${data.name}" already exists for this product.`), { statusCode: 409 });
   }


  return prisma.productVariant.create({
    data: {
      ...data,
      productId: productId, // Link to the product
    },
  });
};

// Function to update an existing variant
export const updateVariant = async (variantId: string, data: UpdateVariantData): Promise<ProductVariant | null> => {
    // Verify the variant exists first
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
        return null; // Or throw 404 error
    }

    // Optional: Check for duplicate SKU/Name if being updated
    if (data.sku) {
        const existingSku = await prisma.productVariant.findFirst({
            where: { productId: variant.productId, sku: data.sku, id: { not: variantId } }
        });
        if (existingSku) {
             throw Object.assign(new Error(`Another variant with SKU "${data.sku}" already exists for this product.`), { statusCode: 409 });
        }
    }
    if (data.name) {
        const existingName = await prisma.productVariant.findFirst({
            where: { productId: variant.productId, name: data.name, id: { not: variantId } }
        });
        if (existingName) {
            throw Object.assign(new Error(`Another variant with name "${data.name}" already exists for this product.`), { statusCode: 409 });
        }
    }

  try {
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
    return updatedVariant;
  } catch (error: any) {
    // P2025: Record to update not found (already handled by initial check, but good practice)
    if (error.code === 'P2025') {
      return null;
    }
    throw error; // Re-throw other errors
  }
};

// Function to delete a variant
export const deleteVariant = async (variantId: string): Promise<ProductVariant | null> => {
    // Optional: Check if variant is in any order items before deleting?
    // This might require adding a relation from OrderItem to ProductVariant
    // and then checking `prisma.orderItem.count({ where: { productVariantId }})`
    // If count > 0, throw a 409 Conflict error.

  try {
    const deletedVariant = await prisma.productVariant.delete({
      where: { id: variantId },
    });
    return deletedVariant;
  } catch (error: any) {
    if (error.code === 'P2025') { // Record to delete not found
      return null;
    }
     // Handle potential foreign key constraint errors (e.g., if linked in OrderItem)
     if (error.code === 'P2003' || error.code === 'P2014') {
        throw Object.assign(new Error(`Cannot delete variant "${variantId}" due to existing relationships (e.g., in orders).`), { statusCode: 409 });
   }
    throw error; // Re-throw other errors
  }
};
