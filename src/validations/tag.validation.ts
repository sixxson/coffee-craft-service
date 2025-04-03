import Joi from 'joi';

// Schema for creating a new tag
export const createTagSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Tag name cannot be empty',
    'any.required': 'Tag name is required',
  }),
});

// Schema for updating an existing tag
export const updateTagSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.empty': 'Tag name cannot be empty if provided',
  }),
}).min(1); // Ensure at least one field is provided for update
