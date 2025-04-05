import Joi from 'joi';
import { VALID_PERIODS, CUSTOM_PERIOD } from '../../utils/period.util';

const getTopSellingProducts = {
  query: Joi.object().keys({
    sortBy: Joi.string().valid('quantity', 'revenue').default('quantity'),
    limit: Joi.number().integer().min(1).max(100).default(10),
    // Period is now optional, default handled by getDateRangeFromPeriod utility
    period: Joi.string().valid(...VALID_PERIODS).optional(),
    startDate: Joi.when('period', {
      is: CUSTOM_PERIOD,
      then: Joi.date().iso().required().messages({
        'date.base': 'Start date must be a valid ISO date',
        'any.required': 'Start date is required when period is custom',
      }),
      otherwise: Joi.date().iso().optional().messages({
        'date.base': 'Start date must be a valid ISO date',
      }),
    }),
    endDate: Joi.when('period', {
      is: CUSTOM_PERIOD,
      then: Joi.date().iso().required().greater(Joi.ref('startDate')).messages({
          'date.base': 'End date must be a valid ISO date',
          'any.required': 'End date is required when period is custom',
          'date.greater': 'End date must be after start date',
        }),
      otherwise: Joi.date().iso().optional().greater(Joi.ref('startDate')).messages({
          'date.base': 'End date must be a valid ISO date',
          'date.greater': 'End date must be after start date',
        }),
    }),
    categoryId: Joi.string().uuid().optional(), // Optional filter by category ID
    brandId: Joi.string().uuid().optional(),    // Optional filter by brand ID
  }),
};

// --- Placeholder for other product stat validations ---
const getProductPerformance = {
  query: Joi.object().keys({
    groupBy: Joi.string().valid('category', 'brand').required().messages({
        'any.required': 'groupBy parameter (category or brand) is required',
        'any.only': 'groupBy must be either "category" or "brand"',
    }),
    // Period is now optional, default handled by getDateRangeFromPeriod utility
    period: Joi.string().valid(...VALID_PERIODS).optional(),
    startDate: Joi.when('period', {
      is: CUSTOM_PERIOD,
      then: Joi.date().iso().required().messages({
        'date.base': 'Start date must be a valid ISO date',
        'any.required': 'Start date is required when period is custom',
      }),
      otherwise: Joi.date().iso().optional().messages({
        'date.base': 'Start date must be a valid ISO date',
      }),
    }),
    endDate: Joi.when('period', {
      is: CUSTOM_PERIOD,
      then: Joi.date().iso().required().greater(Joi.ref('startDate')).messages({
          'date.base': 'End date must be a valid ISO date',
          'any.required': 'End date is required when period is custom',
          'date.greater': 'End date must be after start date',
        }),
      otherwise: Joi.date().iso().optional().greater(Joi.ref('startDate')).messages({
          'date.base': 'End date must be a valid ISO date',
          'date.greater': 'End date must be after start date',
        }),
    }),
  }),
};
const getProductInventory = {
  query: Joi.object().keys({
    lowStockThreshold: Joi.number().integer().min(0).default(10),
  }),
};
const getProductVariantPerformance = {
  query: Joi.object().keys({
    productId: Joi.string().uuid().required().messages({
        'any.required': 'productId is required',
        'string.guid': 'productId must be a valid UUID',
    }),
    // Period is now optional, default handled by getDateRangeFromPeriod utility
    period: Joi.string().valid(...VALID_PERIODS).optional(),
    startDate: Joi.when('period', {
      is: CUSTOM_PERIOD,
      then: Joi.date().iso().required().messages({
        'date.base': 'Start date must be a valid ISO date',
        'any.required': 'Start date is required when period is custom',
      }),
      otherwise: Joi.date().iso().optional().messages({
        'date.base': 'Start date must be a valid ISO date',
      }),
    }),
    endDate: Joi.when('period', {
      is: CUSTOM_PERIOD,
      then: Joi.date().iso().required().greater(Joi.ref('startDate')).messages({
          'date.base': 'End date must be a valid ISO date',
          'any.required': 'End date is required when period is custom',
          'date.greater': 'End date must be after start date',
        }),
      otherwise: Joi.date().iso().optional().greater(Joi.ref('startDate')).messages({
          'date.base': 'End date must be a valid ISO date',
          'date.greater': 'End date must be after start date',
        }),
    }),
  }),
};


export default {
  getTopSellingProducts,
  getProductPerformance,
  getProductInventory,
  getProductVariantPerformance, // Added validation export
};