import Joi from 'joi';

// Schema for creating a new product variant
// productId will typically come from the route parameter, not the body
export const createVariantSchema = Joi.object({
  sku: Joi.string().optional().allow(null, ''), // Optional, might be generated or inherited
  price: Joi.number().positive().required().messages({
    'number.base': 'Variant price must be a number',
    'number.positive': 'Variant price must be a positive number',
    'any.required': 'Variant price is required',
  }),
  discountPrice: Joi.number().positive().optional().allow(null).messages({
    'number.base': 'Variant discount price must be a number',
    'number.positive': 'Variant discount price must be a positive number',
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Variant stock must be a number',
    'number.integer': 'Variant stock must be an integer',
    'number.min': 'Variant stock cannot be negative',
    'any.required': 'Variant stock is required',
  }),
  name: Joi.string().required().messages({ // e.g., "Red, Large"
    'string.empty': 'Variant name cannot be empty',
    'any.required': 'Variant name is required',
  }),
  color: Joi.string().optional().allow(null, ''),
  weight: Joi.string().optional().allow(null, ''),
  material: Joi.string().optional().allow(null, ''),
  // productId is not in the body schema, it comes from the route
});

// Schema for updating an existing product variant
export const updateVariantSchema = Joi.object({
  sku: Joi.string().optional().allow(null, ''),
  price: Joi.number().positive().optional().messages({
    'number.base': 'Variant price must be a number',
    'number.positive': 'Variant price must be a positive number',
  }),
  discountPrice: Joi.number().positive().optional().allow(null).messages({
    'number.base': 'Variant discount price must be a number',
    'number.positive': 'Variant discount price must be a positive number',
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Variant stock must be a number',
    'number.integer': 'Variant stock must be an integer',
    'number.min': 'Variant stock cannot be negative',
  }),
  name: Joi.string().optional().messages({
    'string.empty': 'Variant name cannot be empty if provided',
  }),
  color: Joi.string().optional().allow(null, ''),
  weight: Joi.string().optional().allow(null, ''),
  material: Joi.string().optional().allow(null, ''),
  // productId should not be updatable via this route
}).min(1); // Ensure at least one field is provided for update
