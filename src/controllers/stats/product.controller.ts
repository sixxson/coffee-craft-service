import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as productService from '../../services/stats/product.service'; // Use namespace import
import { Period } from '../../utils/period.util';

const getTopSellingProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract validated query parameters safely.
        // Joi validation middleware ensures these exist and match basic types/enums,
        // and provides defaults if not present in the original query.
        const sortBy = req.query.sortBy as 'quantity' | 'revenue';
        // Use Number() for explicit conversion, middleware ensures valid input
        const limit = Number(req.query.limit);
        const period = req.query.period as Period | undefined; // Can be undefined now
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        const categoryId = req.query.categoryId as string | undefined;
        const brandId = req.query.brandId as string | undefined;

        // Note: Defaults for sortBy, limit, period are handled by the Joi schema & middleware

        const result = await productService.getTopSellingProducts(
            sortBy,
            limit,
            period!, // Pass the validated period (or default handled in service)
            startDate,
            endDate,
            categoryId,
            brandId
        );
        res.status(httpStatus.OK).send(result);
    } catch (error) {
        next(error);
    }
};

// --- Placeholder for other controller functions ---
const getProductPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract validated query parameters
        const groupBy = req.query.groupBy as 'category' | 'brand';
        const period = req.query.period as Period | undefined; // Can be undefined
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const result = await productService.getProductPerformance(
            groupBy,
            period!, // Pass the validated period (or default handled in service)
            startDate,
            endDate
        );
        res.status(httpStatus.OK).send(result);
    } catch (error) {
        next(error);
    }
};
const getProductInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract validated query parameters
        // Middleware now ensures this is a number and default is applied

        // Use Number() for explicit conversion, middleware ensures valid input
        const lowStockThreshold = Number(req.validatedQuery.lowStockThreshold); // Read from validatedQuery

        const result = await productService.getProductInventory(lowStockThreshold);
        res.status(httpStatus.OK).send(result);
    } catch (error) {
        next(error);
    }
};
const getProductVariantPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract validated query parameters
        const productId = req.query.productId as string;
        const period = req.query.period as Period | undefined; // Can be undefined
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const result = await productService.getProductVariantPerformance(
            productId,
            period!, // Pass the validated period (or default handled in service)
            startDate,
            endDate
        );
        res.status(httpStatus.OK).send(result);
    } catch (error) {
        next(error);
    }
};


export default {
    getTopSellingProducts,
    getProductPerformance,
    getProductInventory,
    getProductVariantPerformance, // Added function to export
};