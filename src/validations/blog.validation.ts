import Joi from 'joi';

// Schema for creating a new blog post
// userId will be added from authenticated user in the service/controller
export const createBlogSchema = Joi.object({
  title: Joi.string().required().max(255).messages({
    'string.empty': 'Title cannot be empty',
    'string.max': 'Title cannot exceed 255 characters',
    'any.required': 'Title is required',
  }),
  content: Joi.string().required().messages({
    'string.empty': 'Content cannot be empty',
    'any.required': 'Content is required',
  }),
  thumbnail: Joi.string().uri().optional().allow(null, '').messages({
    'string.uri': 'Thumbnail must be a valid URL',
  }),
  publicationDate: Joi.date().iso().optional().allow(null).messages({
     'date.format': 'Publication date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  }), // Optional, could default to now() in service
  active: Joi.boolean().optional().default(true),
  // slug: Joi.string().optional().allow(null, ''), // Optional, might be auto-generated
});

// Schema for updating an existing blog post
export const updateBlogSchema = Joi.object({
  title: Joi.string().optional().max(255).messages({
    'string.empty': 'Title cannot be empty if provided',
    'string.max': 'Title cannot exceed 255 characters',
  }),
  content: Joi.string().optional().messages({
    'string.empty': 'Content cannot be empty if provided',
  }),
  thumbnail: Joi.string().uri().optional().allow(null, '').messages({
    'string.uri': 'Thumbnail must be a valid URL',
  }),
   publicationDate: Joi.date().iso().optional().allow(null).messages({
     'date.format': 'Publication date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
  }),
  active: Joi.boolean().optional(),
  // slug: Joi.string().optional().allow(null, ''),
}).min(1); // Ensure at least one field is provided for update
