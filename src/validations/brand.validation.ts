import Joi from "joi";

// Schema for creating a new brand
export const createBrandSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Brand name cannot be empty",
    "any.required": "Brand name is required",
  }),
  description: Joi.string().required().messages({
    "string.empty": "Brand description cannot be empty",
    "any.required": "Brand description is required",
  }),
});

// Schema for updating an existing brand
export const updateBrandSchema = Joi.object({
  name: Joi.string().optional().messages({
    // Name is optional on update
    "string.empty": "Brand name cannot be empty if provided",
  }),
  description: Joi.string().optional().allow(""),
}).min(1); // Ensure at least one field is provided for update
