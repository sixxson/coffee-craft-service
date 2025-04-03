import { Request, Response, RequestHandler } from "express";
import * as reviewService from "../services/review.service";
import { UserRole, User } from "@prisma/client"; // Import User type as well

// Remove the custom declaration merging as it conflicts with an existing definition


// Create a new review
export const createReviewHandler: RequestHandler = async (req: Request, res): Promise<void> => { // Use standard Request type
  try {
    // Ensure user is authenticated
    if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    const { id: userId } = req.user; // Get user ID from authenticated user

    // Combine request body with userId
    const input = { ...req.body, userId };

    const review = await reviewService.createReview(input);
    res.status(201).json(review);
  } catch (error: any) {
     console.error("Error creating review:", error);
     const statusCode = error.statusCode || 400;
     res.status(statusCode).json({ error: "Failed to create review", message: error.message });
  }
};

// Get reviews for a specific product
export const getProductReviews: RequestHandler = async (req, res): Promise<void> => {
    try {
        const { productId } = req.params;
        if (!productId) {
            res.status(400).json({ error: "Product ID parameter is required." });
            return;
        }
        const result = await reviewService.getReviewsByProductId(productId, req.query);
        res.json(result); // Returns { data: reviews[], total: number, average: number | null }
    } catch (error: any) {
        console.error("Error fetching product reviews:", error);
        res.status(500).json({ error: "Failed to fetch product reviews", message: error.message });
    }
};

// Get reviews submitted by the currently authenticated user
export const getMyReviews: RequestHandler = async (req: Request, res): Promise<void> => { // Use standard Request type
    try {
        if (!req.user) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }
        const { id: userId } = req.user;
        const result = await reviewService.getReviewsByUserId(userId, req.query);
        res.json(result); // Returns { data: reviews[], total: number }
    } catch (error: any) {
        console.error("Error fetching user reviews:", error);
        res.status(500).json({ error: "Failed to fetch user reviews", message: error.message });
    }
};


// Update a review
export const updateReviewHandler: RequestHandler = async (req: Request, res): Promise<void> => { // Use standard Request type
  try {
    if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    // Use non-null assertion (!) assuming middleware guarantees user presence on protected routes
    const { id: userId, role: userRole } = req.user!;
    const { reviewId } = req.params; // Get reviewId from route params

    // Explicitly assert type when passing to service
    const review = await reviewService.updateReview(reviewId, userId, userRole as UserRole, req.body);

    if (!review) {
      res.status(404).json({ error: "Review not found or not authorized to update" });
      return;
    }

    res.json(review);
  } catch (error: any) {
    console.error("Error updating review:", error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ error: "Failed to update review", message: error.message });
  }
};

// Delete a review
export const deleteReviewHandler: RequestHandler = async (req: Request, res): Promise<void> => { // Use standard Request type
  try {
    if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    // Use non-null assertion (!) assuming middleware guarantees user presence on protected routes
    const { id: userId, role: userRole } = req.user!;
    const { reviewId } = req.params; // Get reviewId from route params

     // Explicitly assert type when passing to service
    const deletedReview = await reviewService.deleteReview(reviewId, userId, userRole as UserRole);

     if (!deletedReview) {
      res.status(404).json({ error: "Review not found or not authorized to delete" });
      return;
    }

    // Successfully deleted
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting review:", error);
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ error: "Failed to delete review", message: error.message });
  }
};
