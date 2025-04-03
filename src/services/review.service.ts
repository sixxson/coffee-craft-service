import { PrismaClient, Review, UserRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library"; // Import Decimal if needed for avgRating calculation

const prisma = new PrismaClient();

interface CreateReviewInput {
  rating: number;
  comment?: string;
  orderItemId: string;
  userId: string; // ID of the user submitting the review
}

interface UpdateReviewInput {
    rating?: number;
    comment?: string;
}

// Function to create a new review
export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  const { rating, comment, orderItemId, userId } = input;

  // 1. Verify the OrderItem exists and belongs to the user
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: { select: { userId: true, status: true } }, // Get user ID and order status
      review: { select: { id: true } } // Check if review already exists
    },
  });

  if (!orderItem) {
    throw Object.assign(new Error(`Order item with ID ${orderItemId} not found.`), { statusCode: 404 });
  }
  if (orderItem.order.userId !== userId) {
    throw Object.assign(new Error(`Not authorized to review this order item.`), { statusCode: 403 });
  }
  // Optional: Check if order status allows review (e.g., must be DELIVERED)
  // if (orderItem.order.status !== 'DELIVERED') {
  //   throw Object.assign(new Error(`Cannot review item until order is delivered.`), { statusCode: 400 });
  // }
  if (orderItem.review) {
      throw Object.assign(new Error(`A review already exists for this order item.`), { statusCode: 409 }); // Conflict
  }


  // 2. Create the review within a transaction to also update product average rating
  return prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          rating,
          comment,
          orderItemId, // Links review uniquely to the order item
          userId, // Link to the user who wrote it
          productId: orderItem.productId, // Link to the product
          productVariantId: orderItem.productVariantId, // Link to the variant if applicable
        },
      });

      // 3. Recalculate and update the average rating for the product
      const stats = await tx.review.aggregate({
          _avg: { rating: true },
          where: { productId: orderItem.productId },
      });
      const avgRating = stats._avg.rating ? new Decimal(stats._avg.rating).toDecimalPlaces(2) : new Decimal(0); // Use Decimal, handle null

      await tx.product.update({
          where: { id: orderItem.productId },
          data: { avgRating: avgRating.toNumber() }, // Convert Decimal to number
      });

      // Optional: Recalculate average rating for the variant if applicable
      // if (orderItem.productVariantId) { ... }

      return newReview;
  });
};

// Function to get reviews (e.g., for a specific product)
export const getReviewsByProductId = async (productId: string, options: any = {}): Promise<{ data: Review[], total: number, average: number | null }> => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where = { productId };

    const reviews = await prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        include: {
            user: { select: { id: true, name: true, imgUrl: true } }, // Include reviewer info
            // Optionally include productVariant info if needed
            // productVariant: { select: { id: true, name: true } }
        },
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    const totalReviews = await prisma.review.count({ where });
    const ratingStats = await prisma.review.aggregate({
        _avg: { rating: true },
        where,
    });

    return {
        data: reviews,
        total: totalReviews,
        average: ratingStats._avg.rating ? new Decimal(ratingStats._avg.rating).toNumber() : null
    };
};

// Function to get reviews by a specific user
export const getReviewsByUserId = async (userId: string, options: any = {}): Promise<{ data: Review[], total: number }> => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where = { userId };

    const reviews = await prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        include: {
            product: { select: { id: true, name: true, images: { where: { isThumbnail: true }, take: 1, select: { url: true } } } },
            productVariant: { select: { id: true, name: true } }
        },
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    const totalReviews = await prisma.review.count({ where });

    return { data: reviews, total: totalReviews };
};


// Function to update a review (e.g., by the user who wrote it or an admin)
export const updateReview = async (reviewId: string, userId: string, userRole: UserRole, data: UpdateReviewInput): Promise<Review | null> => {

    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
        return null; // Not found
    }

    // Authorization: Allow user to update their own review, or admin to update any
    if (review.userId !== userId && userRole !== UserRole.ADMIN) {
         throw Object.assign(new Error(`Not authorized to update this review.`), { statusCode: 403 });
    }

    return prisma.$transaction(async (tx) => {
        const updatedReview = await tx.review.update({
            where: { id: reviewId },
            data: {
                rating: data.rating,
                comment: data.comment,
            },
        });

        // Recalculate average rating if rating was changed
        if (data.rating !== undefined) {
            const stats = await tx.review.aggregate({
                _avg: { rating: true },
                where: { productId: review.productId },
            });
             const avgRating = stats._avg.rating ? new Decimal(stats._avg.rating).toDecimalPlaces(2) : new Decimal(0);

            await tx.product.update({
                where: { id: review.productId },
                data: { avgRating: avgRating.toNumber() }, // Convert Decimal to number
            });
             // Optional: Recalculate variant average rating
        }

        return updatedReview;
    });
};

// Function to delete a review (e.g., by the user who wrote it or an admin)
export const deleteReview = async (reviewId: string, userId: string, userRole: UserRole): Promise<Review | null> => {

    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
        return null; // Not found
    }

     // Authorization: Allow user to delete their own review, or admin to delete any
     if (review.userId !== userId && userRole !== UserRole.ADMIN) {
        throw Object.assign(new Error(`Not authorized to delete this review.`), { statusCode: 403 });
   }

   return prisma.$transaction(async (tx) => {
       const deletedReview = await tx.review.delete({
           where: { id: reviewId },
       });

       // Recalculate average rating after deletion
       const stats = await tx.review.aggregate({
           _avg: { rating: true },
           where: { productId: review.productId },
       });
       const avgRating = stats._avg.rating ? new Decimal(stats._avg.rating).toDecimalPlaces(2) : new Decimal(0);

       await tx.product.update({
           where: { id: review.productId },
           data: { avgRating: avgRating.toNumber() }, // Convert Decimal to number
       });
        // Optional: Recalculate variant average rating

       return deletedReview;
   });
};
