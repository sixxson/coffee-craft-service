import { Request, Response, NextFunction } from 'express';
import * as voucherService from '../../services/stats/voucher.service';
import { Period } from '../../utils/period.util';

// Define types for validated query parameters
interface ValidatedVoucherUsageQuery {
    period?: Period;
    startDate?: string;
    endDate?: string;
    limit: number; // Defaulted by Joi
    sortBy: 'usageCount' | 'totalDiscount'; // Defaulted by Joi
}

interface ValidatedVoucherEffectivenessQuery {
    period?: Period;
    startDate?: string;
    endDate?: string;
    voucherCode?: string; // Optional
}


export const getVoucherUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const queryParams = req.validatedQuery as ValidatedVoucherUsageQuery;
        const result = await voucherService.getVoucherUsage(
            queryParams.limit,
            queryParams.sortBy,
            queryParams.period,
            queryParams.startDate,
            queryParams.endDate
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getVoucherEffectiveness = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const queryParams = req.validatedQuery as ValidatedVoucherEffectivenessQuery;
        const result = await voucherService.getVoucherEffectiveness(
            queryParams.voucherCode,
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
    getVoucherUsage,
    getVoucherEffectiveness,
};