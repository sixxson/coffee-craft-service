import { Request, Response, RequestHandler } from "express";
import * as blogService from "../services/blog.service";
import { UserRole } from "@prisma/client"; // Assuming UserRole is needed from req.user

// Assuming declaration merging for Express.Request exists elsewhere or is not needed if auth middleware doesn't attach user
// declare global {
//     namespace Express {
//         interface Request {
//             user?: { id: string; role: UserRole; };
//         }
//     }
// }

// Get all blog posts
export const getBlogs: RequestHandler = async (req, res): Promise<void> => {
  try {
    // Filter out inactive posts for public view unless specifically requested by admin/staff
    const queryOptions = { ...req.query };
    // if (!req.user || (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.STAFF)) {
    //     queryOptions.active = true; // Default to only active posts for public
    // }

    const result = await blogService.getAllBlogs(queryOptions);
    res.json(result); // Sends { data: blogs[], total: number }
  } catch (error: any) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Failed to fetch blogs", message: error.message });
  }
};

// Get a single blog post by ID
export const getBlog: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const blog = await blogService.getBlogById(id);

    if (!blog) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }

    // Optional: Check if post is active for public view
    // if (!blog.active && (!req.user || (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.STAFF))) {
    //      res.status(404).json({ error: "Blog post not found" }); // Treat inactive as not found for public
    //      return;
    // }

    res.json(blog);
  } catch (error: any) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({ error: "Failed to fetch blog post", message: error.message });
  }
};

// Create a new blog post
export const createBlogHandler: RequestHandler = async (req: Request, res): Promise<void> => {
  try {
     if (!req.user) { // Assumes req.user is populated by auth middleware
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    // Assuming only Staff/Admin can create blog posts
     if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.STAFF) {
         res.status(403).json({ error: "Forbidden: Only Staff or Admin can create blog posts." });
         return;
     }

    const { id: userId } = req.user;
    const blog = await blogService.createBlog(userId, req.body);
    res.status(201).json(blog);
  } catch (error: any) {
     console.error("Error creating blog post:", error);
     const statusCode = error.statusCode || 400;
     res.status(statusCode).json({ error: "Failed to create blog post", message: error.message });
  }
};

// Update an existing blog post
export const updateBlogHandler: RequestHandler = async (req: Request, res): Promise<void> => {
  try {
     if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    // Use non-null assertion assuming auth middleware guarantees user presence
    const { id: userId, role: userRole } = req.user!;
    const { id: blogId } = req.params;

    // Add type assertion for userRole
    const blog = await blogService.updateBlog(blogId, userId, userRole as UserRole, req.body);

    if (!blog) {
      res.status(404).json({ error: "Blog post not found or not authorized to update" });
      return;
    }

    res.json(blog);
  } catch (error: any) {
    console.error("Error updating blog post:", error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ error: "Failed to update blog post", message: error.message });
  }
};

// Delete a blog post
export const deleteBlogHandler: RequestHandler = async (req: Request, res): Promise<void> => {
  try {
     if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    // Use non-null assertion assuming auth middleware guarantees user presence
    const { id: userId, role: userRole } = req.user!;
    const { id: blogId } = req.params;

    // Add type assertion for userRole
    const deletedBlog = await blogService.deleteBlog(blogId, userId, userRole as UserRole);

     if (!deletedBlog) {
      res.status(404).json({ error: "Blog post not found or not authorized to delete" });
      return;
    }

    // Successfully deleted
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting blog post:", error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ error: "Failed to delete blog post", message: error.message });
  }
};
