import Joi from 'joi';

// Schema for creating a new product
export const createProductSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Product name cannot be empty',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().optional().allow(''),
  price: Joi.number().positive().required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number',
    'any.required': 'Price is required',
  }),
  categoryId: Joi.string().uuid().required().messages({
    'string.guid': 'Category ID must be a valid UUID',
    'any.required': 'Category ID is required',
  }),
  brandId: Joi.string().uuid().required().messages({ // Assuming brand is required
    'string.guid': 'Brand ID must be a valid UUID',
    'any.required': 'Brand ID is required',
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be an integer',
    'number.min': 'Stock cannot be negative',
    'any.required': 'Stock is required',
  }),
  active: Joi.boolean().optional().default(true),
  // images: Joi.array().items(Joi.object(...)) // Add image validation if handled here
});

// Schema for updating an existing product
export const updateProductSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.empty': 'Product name cannot be empty if provided',
  }),
  description: Joi.string().optional().allow(''),
  price: Joi.number().positive().optional().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number',
  }),
  categoryId: Joi.string().uuid().optional().messages({
    'string.guid': 'Category ID must be a valid UUID',
  }),
  brandId: Joi.string().uuid().optional().messages({
    'string.guid': 'Brand ID must be a valid UUID',
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be an integer',
    'number.min': 'Stock cannot be negative',
  }),
  active: Joi.boolean().optional(),
  // images: Joi.array().items(Joi.object(...)) // Add image validation if handled here
}).min(1); // Ensure at least one field is provided for update
