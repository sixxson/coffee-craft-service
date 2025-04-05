import Joi from 'joi';
import { VALID_PERIODS, CUSTOM_PERIOD } from '../../utils/period.util';

// Base schema for period filtering reused from other stats validations
const periodQuerySchema = Joi.object({
    period: Joi.string().valid(...VALID_PERIODS).optional(),
    startDate: Joi.when('period', {
      is: CUSTOM_PERIOD,
      then: Joi.date().iso().required().messages({
        'date.base': 'Start date must be a valid ISO date (YYYY-MM-DD)',
        'any.required': 'Start date is required when period is custom',
      }),
      otherwise: Joi.date().iso().optional().messages({
        'date.base': 'Start date must be a valid ISO date (YYYY-MM-DD)',
      }),
    }),
    endDate: Joi.when('period', {
      is: CUSTOM_PERIOD,
      then: Joi.date().iso().required().greater(Joi.ref('startDate')).messages({
          'date.base': 'End date must be a valid ISO date (YYYY-MM-DD)',
          'any.required': 'End date is required when period is custom',
          'date.greater': 'End date must be after start date',
        }),
      otherwise: Joi.date().iso().optional().greater(Joi.ref('startDate')).messages({
          'date.base': 'End date must be a valid ISO date (YYYY-MM-DD)',
          'date.greater': 'End date must be after start date',
        }),
    }),
});


const getVoucherUsage = {
  query: periodQuerySchema.keys({ // Extend base schema
    limit: Joi.number().integer().min(1).max(100).optional().default(10),
    sortBy: Joi.string().valid('usageCount', 'totalDiscount').optional().default('usageCount'),
  }),
};

const getVoucherEffectiveness = {
  query: periodQuerySchema.keys({ // Extend base schema
    voucherCode: Joi.string().optional(), // Optional filter by code
  }),
};


export default {
  getVoucherUsage,
  getVoucherEffectiveness,
};