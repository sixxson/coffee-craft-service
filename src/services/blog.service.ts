import { PrismaClient, Blog, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// Interface for create data, userId will be added
interface CreateBlogData {
    title: string;
    content: string;
    thumbnail?: string | null;
    publicationDate?: Date | string | null;
    active?: boolean;
    // slug?: string | null;
}

// Interface for update data
interface UpdateBlogData {
    title?: string;
    content?: string;
    thumbnail?: string | null;
    publicationDate?: Date | string | null;
    active?: boolean;
    // slug?: string | null;
}

// Function to get all blog posts with pagination
export const getAllBlogs = async (options: any = {}): Promise<{ data: Blog[], total: number }> => {
    const { page = 1, limit = 10, sortBy = 'publicationDate', sortOrder = 'desc', active, authorId } = options;

    const where: any = {};
    if (active !== undefined) {
        where.active = active === 'true' || active === true;
    }
     if (authorId) {
        where.userId = authorId;
    }

    const blogs = await prisma.blog.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        include: {
            author: { select: { id: true, name: true, imgUrl: true } } // Include basic author info
        },
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    const totalBlogs = await prisma.blog.count({ where });

    return { data: blogs, total: totalBlogs };
};

// Function to get a blog post by ID
export const getBlogById = async (id: string): Promise<Blog | null> => {
    return prisma.blog.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, name: true, imgUrl: true } }
        }
    });
};

// Function to create a new blog post
export const createBlog = async (userId: string, data: CreateBlogData): Promise<Blog> => {
    // Optional: Generate slug from title if needed
    // const slug = data.slug || generateSlug(data.title); // Assuming a generateSlug function

    return prisma.blog.create({
        data: {
            ...data,
            publicationDate: data.publicationDate ? new Date(data.publicationDate) : new Date(), // Default to now if not provided
            userId: userId, // Link to the author
            // slug: slug,
        },
        include: {
            author: { select: { id: true, name: true, imgUrl: true } }
        }
    });
};

// Function to update a blog post
export const updateBlog = async (blogId: string, userId: string, userRole: UserRole, data: UpdateBlogData): Promise<Blog | null> => {
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });

    if (!blog) {
        return null; // Not found
    }

    // Authorization: Allow author or Admin/Staff to update
    if (blog.userId !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
        throw Object.assign(new Error(`Not authorized to update this blog post.`), { statusCode: 403 });
    }

    // Optional: Regenerate slug if title changes and slug is used
    // const updateData: any = { ...data };
    // if (data.title && !data.slug) { // If title changes and slug isn't explicitly set
    //     updateData.slug = generateSlug(data.title);
    // }
    const updateData: any = { ...data };
     if (updateData.publicationDate) {
        updateData.publicationDate = new Date(updateData.publicationDate);
    }


    try {
        const updatedBlog = await prisma.blog.update({
            where: { id: blogId },
            data: updateData,
             include: {
                author: { select: { id: true, name: true, imgUrl: true } }
            }
        });
        return updatedBlog;
    } catch (error: any) {
        if (error.code === 'P2025') { // Record not found
            return null;
        }
        // Handle potential unique constraint errors (e.g., if slug is unique)
        // if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        //     throw Object.assign(new Error(`Blog post with this slug already exists.`), { statusCode: 409 });
        // }
        throw error;
    }
};

// Function to delete a blog post
export const deleteBlog = async (blogId: string, userId: string, userRole: UserRole): Promise<Blog | null> => {
     const blog = await prisma.blog.findUnique({ where: { id: blogId } });

    if (!blog) {
        return null; // Not found
    }

    // Authorization: Allow author or Admin/Staff to delete
    if (blog.userId !== userId && userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
        throw Object.assign(new Error(`Not authorized to delete this blog post.`), { statusCode: 403 });
    }

    try {
        const deletedBlog = await prisma.blog.delete({
            where: { id: blogId },
        });
        return deletedBlog;
    } catch (error: any) {
        if (error.code === 'P2025') { // Record not found
            return null;
        }
        throw error;
    }
};
