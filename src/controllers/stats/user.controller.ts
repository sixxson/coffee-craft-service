import { Request, Response, NextFunction } from 'express';
import * as userService from '../../services/stats/user.service';
import { Period } from '../../utils/period.util'; // Import Period type if needed for casting

// Define types for validated query parameters based on validation schemas
interface ValidatedUserSummaryQuery {
    period?: Period;
    startDate?: string;
    endDate?: string;
    activeThresholdDays: number; // Defaulted by Joi
}

interface ValidatedTopSpendersQuery {
    period?: Period;
    startDate?: string;
    endDate?: string;
    limit: number; // Defaulted by Joi
    sortBy: 'totalSpent' | 'orderCount'; // Defaulted by Joi
}

interface ValidatedNewRegistrationsQuery {
    period?: Period;
    startDate?: string;
    endDate?: string;
    groupBy: 'day' | 'week' | 'month'; // Defaulted by Joi
}


export const getUserSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Use validatedQuery set by the middleware
        const queryParams = req.validatedQuery as ValidatedUserSummaryQuery;
        const summary = await userService.getUserSummary(
            queryParams.period,
            queryParams.startDate,
            queryParams.endDate,
            queryParams.activeThresholdDays
        );
        res.json(summary);
    } catch (error) {
        next(error);
    }
};

export const getRoleDistribution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const distribution = await userService.getRoleDistribution();
        res.json({ data: distribution }); // Wrap in data object for consistency if desired
    } catch (error) {
        next(error);
    }
};

export const getTopSpenders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const queryParams = req.validatedQuery as ValidatedTopSpendersQuery;
        const result = await userService.getTopSpenders(
            queryParams.limit,
            queryParams.sortBy, // Pass sortBy to the service
            queryParams.period,
            queryParams.startDate,
            queryParams.endDate
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getNewRegistrations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const queryParams = req.validatedQuery as ValidatedNewRegistrationsQuery;
        const result = await userService.getNewRegistrations(
            queryParams.groupBy,
            queryParams.period,
            queryParams.startDate,
            queryParams.endDate
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Export controller functions
export default {
    getUserSummary,
    getRoleDistribution,
    getTopSpenders,
    getNewRegistrations,
};