import { PrismaClient, Tag, Prisma } from "@prisma/client"; // Import Prisma
import { parsePaginationAndSorting } from "../utils/utils"; // Import helper

const prisma = new PrismaClient();

// Function to get all tags with pagination and product count
export const getAllTags = async (options: any = {}): Promise<{ data: Tag[], total: number }> => {
  // Use helper for pagination and sorting (defaulting to updatedAt desc)
  const { skip, take, orderBy } = parsePaginationAndSorting(options);

  const findManyArgs: Prisma.TagFindManyArgs = {
    skip,
    take,
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy, // Use orderBy from helper
  };

  const [tags, totalTags] = await prisma.$transaction([
      prisma.tag.findMany(findManyArgs),
      prisma.tag.count({ where: findManyArgs.where }) // Add count query
  ]);

  return { data: tags, total: totalTags };
};

// Function to get a tag by ID
export const getTagById = async (id: string): Promise<Tag | null> => {
  return prisma.tag.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
};

// Function to create a new tag
export const createTag = async (data: { name: string }): Promise<Tag> => {
  // Check if tag with the same name already exists (case-insensitive check might be better)
  const existingTag = await prisma.tag.findUnique({
      where: { name: data.name }
  });
  if (existingTag) {
      throw Object.assign(new Error(`Tag with name "${data.name}" already exists.`), { statusCode: 409 }); // Conflict
  }

  return prisma.tag.create({
    data,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
};

// Function to update a tag
export const updateTag = async (id: string, data: { name?: string }): Promise<Tag | null> => {
   // Check if new name already exists (if name is being updated)
   if (data.name) {
       const existingTag = await prisma.tag.findFirst({
           where: {
               name: data.name,
               id: { not: id } // Exclude the current tag being updated
           }
       });
       if (existingTag) {
           throw Object.assign(new Error(`Another tag with name "${data.name}" already exists.`), { statusCode: 409 });
       }
   }

  try {
      const updatedTag = await prisma.tag.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
      return updatedTag;
  } catch (error: any) {
      if (error.code === 'P2025') { // Prisma code for record not found
          return null; // Return null if tag to update wasn't found
      }
      throw error; // Re-throw other errors
  }
};

// Function to delete a tag
export const deleteTag = async (id: string): Promise<Tag | null> => {
  // Optional: Check if tag is associated with any products before deleting
  // const productCount = await prisma.product.count({ where: { tags: { some: { id } } } });
  // if (productCount > 0) {
  //   throw Object.assign(new Error(`Cannot delete tag "${id}" as it is associated with ${productCount} products.`), { statusCode: 409 });
  // }

  try {
      const deletedTag = await prisma.tag.delete({
        where: { id },
      });
      return deletedTag;
  } catch (error: any) {
      if (error.code === 'P2025') { // Prisma code for record not found
          return null; // Return null if tag to delete wasn't found
      }
       // Handle potential foreign key constraint errors if products relation isn't handled properly elsewhere
      if (error.code === 'P2003' || error.code === 'P2014') { // Foreign key constraint violation
           throw Object.assign(new Error(`Cannot delete tag "${id}" due to existing relationships.`), { statusCode: 409 });
      }
      throw error; // Re-throw other errors
  }
};
