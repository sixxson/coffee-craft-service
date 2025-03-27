import Joi from "joi";

// Schema for creating a new category
export const createCategorySchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Category name cannot be empty",
    "any.required": "Category name is required",
  }),
  description: Joi.string().required().messages({
    "string.empty": "Category description cannot be empty",
    "any.required": "Category description is required",
  }),
  parentId: Joi.string().uuid().optional().allow(null, ""),
});

// Schema for updating an existing category
export const updateCategorySchema = Joi.object({
  name: Joi.string().optional().messages({
    "string.empty": "Category name cannot be empty if provided",
  }),
  description: Joi.string().optional().allow(""),
  parentId: Joi.string().uuid().optional().allow(null, ""), // Optional, must be a valid UUID if provided
}).min(1); // Ensure at least one field is provided for update
