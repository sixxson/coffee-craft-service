import Joi from 'joi';
import { VoucherType } from '@prisma/client'; // Import VoucherType enum

// Schema for creating a new voucher
export const createVoucherSchema = Joi.object({
  code: Joi.string().required().messages({
    'string.empty': 'Voucher code cannot be empty',
    'any.required': 'Voucher code is required',
  }),
  type: Joi.string()
    .valid(...Object.values(VoucherType))
    .required()
    .messages({
      'any.only': 'Invalid voucher type',
      'any.required': 'Voucher type is required',
    }),
  discountPercent: Joi.number().positive().optional().allow(null).messages({
    'number.base': 'Discount percent must be a number',
    'number.positive': 'Discount percent must be positive',
  }),
  discountAmount: Joi.number().positive().optional().allow(null).messages({
    'number.base': 'Discount amount must be a number',
    'number.positive': 'Discount amount must be positive',
  }),
  maxDiscount: Joi.number().positive().optional().allow(null).messages({
    'number.base': 'Maximum discount must be a number',
    'number.positive': 'Maximum discount must be positive',
  }),
  startDate: Joi.date().iso().required().messages({
    'date.format': 'Start date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().iso().required().greater(Joi.ref('startDate')).messages({
    'date.format': 'End date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    'date.greater': 'End date must be after start date',
    'any.required': 'End date is required',
  }),
  usageLimit: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.base': 'Usage limit must be a number',
    'number.integer': 'Usage limit must be an integer',
    'number.min': 'Usage limit must be at least 1',
  }),
  minimumOrderValue: Joi.number().positive().optional().allow(null).messages({
     'number.base': 'Minimum order value must be a number',
     'number.positive': 'Minimum order value must be positive',
  }),
  isActive: Joi.boolean().optional().default(true),
  applicableCategoryIds: Joi.array().items(Joi.string().uuid()).optional().messages({ // Assuming IDs are passed
    'array.base': 'Applicable category IDs must be an array',
    'string.guid': 'Each applicable category ID must be a valid UUID',
  }),
  excludedProductIds: Joi.array().items(Joi.string().uuid()).optional().messages({ // Assuming IDs are passed
    'array.base': 'Excluded product IDs must be an array',
    'string.guid': 'Each excluded product ID must be a valid UUID',
  }),
}).or('discountPercent', 'discountAmount'); // Ensure at least one discount type is provided

// Schema for updating an existing voucher
export const updateVoucherSchema = Joi.object({
  code: Joi.string().optional().messages({
    'string.empty': 'Voucher code cannot be empty if provided',
  }),
  type: Joi.string()
    .valid(...Object.values(VoucherType))
    .optional()
    .messages({
      'any.only': 'Invalid voucher type',
    }),
  discountPercent: Joi.number().positive().optional().allow(null).messages({
    'number.base': 'Discount percent must be a number',
    'number.positive': 'Discount percent must be positive',
  }),
  discountAmount: Joi.number().positive().optional().allow(null).messages({
    'number.base': 'Discount amount must be a number',
    'number.positive': 'Discount amount must be positive',
  }),
  maxDiscount: Joi.number().positive().optional().allow(null).messages({
    'number.base': 'Maximum discount must be a number',
    'number.positive': 'Maximum discount must be positive',
  }),
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  }),
  endDate: Joi.date().iso().optional().greater(Joi.ref('startDate')).messages({
    'date.format': 'End date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
     'date.greater': 'End date must be after start date',
  }),
  usageLimit: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.base': 'Usage limit must be a number',
    'number.integer': 'Usage limit must be an integer',
    'number.min': 'Usage limit must be at least 1',
  }),
   minimumOrderValue: Joi.number().positive().optional().allow(null).messages({
     'number.base': 'Minimum order value must be a number',
     'number.positive': 'Minimum order value must be positive',
  }),
  isActive: Joi.boolean().optional(),
  applicableCategoryIds: Joi.array().items(Joi.string().uuid()).optional().messages({
    'array.base': 'Applicable category IDs must be an array',
    'string.guid': 'Each applicable category ID must be a valid UUID',
  }),
  excludedProductIds: Joi.array().items(Joi.string().uuid()).optional().messages({
    'array.base': 'Excluded product IDs must be an array',
    'string.guid': 'Each excluded product ID must be a valid UUID',
  }),
  // usedCount is managed internally
}).min(1); // Ensure at least one field is provided for update
