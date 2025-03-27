import Joi from "joi";

// Schema for creating a new shipping address
export const createShippingAddressSchema = Joi.object({
  address: Joi.string().required().messages({
    "string.empty": "Address cannot be empty",
    "any.required": "Address is required",
  }),
  receiverName: Joi.string().required().messages({
    "string.empty": "Receiver name cannot be empty",
    "any.required": "Receiver name is required",
  }),
  receiverPhone: Joi.string()
    .required()
    .pattern(/^[0-9]+$/) // Basic pattern for digits only
    .min(10) // Example: Minimum length
    .max(15) // Example: Maximum length
    .messages({
      "string.empty": "Receiver phone cannot be empty",
      "any.required": "Receiver phone is required",
      "string.pattern.base": "Receiver phone must contain only digits",
      "string.min": "Receiver phone must be at least 10 digits",
      "string.max": "Receiver phone cannot exceed 15 digits",
    }),
});

// Schema for updating an existing shipping address
// All fields are optional, but if provided, they must meet the criteria
export const updateShippingAddressSchema = Joi.object({
  address: Joi.string().optional().messages({
    "string.empty": "Address cannot be empty if provided",
  }),
  receiverName: Joi.string().optional().messages({
    "string.empty": "Receiver name cannot be empty if provided",
  }),
  receiverPhone: Joi.string()
    .optional()
    .pattern(/^[0-9]+$/)
    .min(10)
    .max(15)
    .messages({
      "string.pattern.base":
        "Receiver phone must contain only digits if provided",
      "string.min": "Receiver phone must be at least 10 digits if provided",
      "string.max": "Receiver phone cannot exceed 15 digits if provided",
    }),
}).min(1); // Ensure at least one field is provided for update
