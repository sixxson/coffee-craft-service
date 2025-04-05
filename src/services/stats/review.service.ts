import { PrismaClient } from '@prisma/client';
import { getDateRangeFromPeriod, Period } from '../../utils/period.util';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// --- Define Types ---

interface ReviewSummaryResult {
    startDate?: Date; // Optional, relates to newReviewsInPeriod
    endDate?: Date;   // Optional, relates to newReviewsInPeriod
    averageRating: number | null; // Can be null if no reviews exist
    totalReviews: number;
    newReviewsInPeriod: number;
}

interface RatingDistributionData {
    rating: number; // 1-5
    count: number;
}

interface RatingDistributionResult {
    startDate?: Date; // Optional, relates to the period filter
    endDate?: Date;   // Optional, relates to the period filter
    productId?: string; // Included if filtered by product
    data: RatingDistributionData[];
}

interface ReviewByProductData {
    productId: string;
    name: string;
    sku: string;
    averageRating: number | null; // Can be null if no reviews
    reviewCount: number;
}

interface ReviewsByProductResult {
    page: number;
    limit: number;
    totalPages: number;
    totalProducts: number; // Total products matching criteria (e.g., minReviews)
    data: ReviewByProductData[];
}

// Explicit type for the groupBy aggregation result
type ReviewGroupByResult = {
    productId: string;
    _avg: {
        rating: number | null;
    } | null; // Prisma's _avg can be null if no records match
    _count: {
        _all: number; // Use _all for the count
    } | null; // Prisma's _count can be null
};

// --- Service Functions ---

// Function for Review Summary
export const getReviewSummary = async (
    period?: Period,
    customStartDate?: string,
    customEndDate?: string
): Promise<ReviewSummaryResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);
    const isPeriodSpecified = !!(period || (customStartDate && customEndDate));

    // Perform queries concurrently
    const [totalReviewsCount, newReviewsCount, ratingAggregation] = await Promise.all([
        prisma.review.count(), // Total count of all reviews
        prisma.review.count({   // Count reviews within the specified period
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        }),
        prisma.review.aggregate({ // Calculate average rating across ALL reviews
            _avg: {
                rating: true,
            },
        }),
    ]);

    // Prisma returns Decimal for avg, convert to number or null
    const averageRating = ratingAggregation._avg.rating ? ratingAggregation._avg.rating : null;


    return {
        startDate: isPeriodSpecified ? startDate : undefined,
        endDate: isPeriodSpecified ? endDate : undefined,
        averageRating: averageRating,
        totalReviews: totalReviewsCount,
        newReviewsInPeriod: newReviewsCount,
    };
};

// Function for Rating Distribution
export const getRatingDistribution = async (
    productId?: string,
    period?: Period,
    customStartDate?: string,
    customEndDate?: string
): Promise<RatingDistributionResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);
    const isPeriodSpecified = !!(period || (customStartDate && customEndDate));

    // Base where clause
    const whereClause: any = {
         createdAt: {
             gte: startDate,
             lte: endDate,
         },
    };

    // Add productId filter if provided
    if (productId) {
        whereClause.productId = productId;
    }

    const results = await prisma.review.groupBy({
        by: ['rating'],
        where: whereClause,
        _count: {
            id: true, // Count reviews by ID
        },
    });

    // Map results and ensure all ratings (1-5) are present
    const ratingMap = new Map<number, number>();
    results.forEach(result => {
        ratingMap.set(result.rating, result._count.id || 0);
    });

    const data: RatingDistributionData[] = [1, 2, 3, 4, 5].map(rating => ({
        rating: rating,
        count: ratingMap.get(rating) || 0,
    }));

    return {
        startDate: isPeriodSpecified ? startDate : undefined,
        endDate: isPeriodSpecified ? endDate : undefined,
        productId: productId, // Include productId if it was used for filtering
        data,
    };
};

// Function for Reviews By Product (Paginated)
export const getReviewsByProduct = async (
    limit: number,
    page: number,
    sortBy: 'avgRatingDesc' | 'avgRatingAsc' | 'reviewCountDesc' | 'reviewCountAsc',
    minReviews: number
): Promise<ReviewsByProductResult> => {
    const skip = (page - 1) * limit;

    // Determine orderBy clause for Prisma aggregation
    let orderByClause: any = {};
    switch (sortBy) {
        case 'avgRatingDesc':
            orderByClause = { _avg: { rating: 'desc' } };
            break;
        case 'avgRatingAsc':
            orderByClause = { _avg: { rating: 'asc' } };
            break;
        case 'reviewCountDesc':
            orderByClause = { _count: { id: 'desc' } };
            break;
        case 'reviewCountAsc':
            orderByClause = { _count: { id: 'asc' } };
            break;
    }

    // Aggregate reviews: group by productId, calculate avg(rating), count reviews
    const aggregation = await prisma.review.groupBy({
        by: ['productId'],
        _avg: {
            rating: true,
        },
        _count: {
            _all: true, // Use _all or a specific field like id to count reviews in the group
        },
        // having clause removed - filtering will happen in code
        // orderBy: orderByClause, // Removed: Sorting is done later in code
        // We fetch all groups first, then filter, sort, and paginate in code
        // skip: skip, // Removed for now - applied later in code
        // take: limit, // Removed for now
    }); // Removed explicit type cast - let TS infer

    // Filter aggregation results based on minReviews in code
    const filteredAggregation = aggregation.filter(agg => (agg._count?._all ?? 0) >= minReviews); // Use optional chaining for _count

    // Get the total count of products matching the criteria *after* filtering
    const totalProductsCount = filteredAggregation.length;
    const totalPages = Math.ceil(totalProductsCount / limit);

    // Apply sorting to the filtered results
    filteredAggregation.sort((a, b) => {
         // Use optional chaining for potentially null _avg and _count
         switch (sortBy) {
            case 'avgRatingDesc':
                // Handle nulls (e.g., treat null as lowest)
                return (b._avg?.rating ?? -1) - (a._avg?.rating ?? -1);
            case 'avgRatingAsc':
                return (a._avg?.rating ?? -1) - (b._avg?.rating ?? -1);
            case 'reviewCountDesc':
                return (b._count?._all ?? 0) - (a._count?._all ?? 0);
            case 'reviewCountAsc':
                return (a._count?._all ?? 0) - (b._count?._all ?? 0);
            default:
                return 0;
        }
    });

    // Apply pagination *after* filtering and sorting
    const paginatedAggregation = filteredAggregation.slice(skip, skip + limit);

    // Remove the separate total count query as we now calculate it from the filtered results


    if (paginatedAggregation.length === 0) { // Check the paginated results
        return { page, limit, totalPages: 0, totalProducts: 0, data: [] };
    }

    // Fetch product details for the paginated results
    const productIds = paginatedAggregation.map(agg => agg.productId); // Use paginated results
    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds },
        },
        select: {
            id: true,
            name: true,
            sku: true,
        },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Combine paginated aggregation results with product details
    const data: ReviewByProductData[] = paginatedAggregation.map(agg => {
        const product = productMap.get(agg.productId);
        return {
            productId: agg.productId,
            name: product?.name ?? 'Unknown Product',
            sku: product?.sku ?? 'N/A',
            averageRating: agg._avg?.rating ?? null, // Use optional chaining
            reviewCount: agg._count?._all ?? 0, // Use optional chaining
        };
    });

    // No need to re-sort here as we sorted the filteredAggregation before pagination
    const finalData = data; // Already in the correct order

    return {
        page,
        limit,
        totalPages,
        totalProducts: totalProductsCount,
        data: finalData,
    };
};