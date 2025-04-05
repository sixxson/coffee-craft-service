import { Request, Response, NextFunction } from 'express';
import * as reviewService from '../../services/stats/review.service';
import { Period } from '../../utils/period.util';

// Define types for validated query parameters
interface ValidatedReviewSummaryQuery {
    period?: Period;
    startDate?: string;
    endDate?: string;
}

interface ValidatedRatingDistributionQuery {
    period?: Period;
    startDate?: string;
    endDate?: string;
    productId?: string; // Optional
}

interface ValidatedReviewsByProductQuery {
    limit: number; // Defaulted by Joi
    page: number;  // Defaulted by Joi
    sortBy: 'avgRatingDesc' | 'avgRatingAsc' | 'reviewCountDesc' | 'reviewCountAsc'; // Defaulted by Joi
    minReviews: number; // Defaulted by Joi
}


export const getReviewSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const queryParams = req.validatedQuery as ValidatedReviewSummaryQuery;
        const summary = await reviewService.getReviewSummary(
            queryParams.period,
            queryParams.startDate,
            queryParams.endDate
        );
        res.json(summary);
    } catch (error) {
        next(error);
    }
};

export const getRatingDistribution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const queryParams = req.validatedQuery as ValidatedRatingDistributionQuery;
        const result = await reviewService.getRatingDistribution(
            queryParams.productId,
            queryParams.period,
            queryParams.startDate,
            queryParams.endDate
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getReviewsByProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const queryParams = req.validatedQuery as ValidatedReviewsByProductQuery;
        const result = await reviewService.getReviewsByProduct(
            queryParams.limit,
            queryParams.page,
            queryParams.sortBy,
            queryParams.minReviews
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Export controller functions
export default {
    getReviewSummary,
    getRatingDistribution,
    getReviewsByProduct,
};