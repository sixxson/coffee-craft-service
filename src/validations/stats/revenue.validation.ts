import Joi from 'joi';
import { VALID_PERIODS, CUSTOM_PERIOD } from '../../utils/period.util';

const getRevenueSummary = {
  query: Joi.object().keys({
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

const getRevenueByPaymentMethod = {
  query: getRevenueSummary.query, // Reuse the same query validation
};

const getOrdersByStatus = {
  query: getRevenueSummary.query, // Reuse the same query validation
};

const getOrdersByPaymentStatus = {
  query: getRevenueSummary.query, // Reuse the same query validation
};

const getOrderFinancials = {
  query: getRevenueSummary.query, // Reuse the same query validation
};


export default {
  getRevenueSummary,
  getRevenueByPaymentMethod,
  getOrdersByStatus,
  getOrdersByPaymentStatus,
  getOrderFinancials,
};