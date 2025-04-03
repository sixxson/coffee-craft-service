import Joi from 'joi';

// Schema for creating a new review
// userId, productId, productVariantId are derived from orderItemId in the service
export const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating must be at most 5',
    'any.required': 'Rating is required',
  }),
  comment: Joi.string().optional().allow(null, '').max(1000).messages({ // Add max length
      'string.max': 'Comment cannot exceed 1000 characters',
  }),
  orderItemId: Joi.string().uuid().required().messages({
    'string.guid': 'Order Item ID must be a valid UUID',
    'any.required': 'Order Item ID is required to submit a review',
  }),
});

// Schema for updating an existing review (less common, maybe only comment/rating?)
export const updateReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional().messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating must be at most 5',
    }),
    comment: Joi.string().optional().allow(null, '').max(1000).messages({
        'string.max': 'Comment cannot exceed 1000 characters',
    }),
}).min(1); // Ensure at least one field is provided for update
