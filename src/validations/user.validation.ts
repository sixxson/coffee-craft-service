import Joi from 'joi';

// Schema for updating user profile information (by the user themselves)
export const updateUserProfileSchema = Joi.object({
  name: Joi.string().optional().allow('').messages({
    'string.empty': 'Name cannot be empty if provided',
  }),
  phone: Joi.string()
    .optional()
    .allow(null, '') // Allow null or empty string to clear the phone number
    .pattern(/^[0-9]+$/)
    .min(10)
    .max(15)
    .messages({
      'string.pattern.base': 'Phone must contain only digits if provided',
      'string.min': 'Phone must be at least 10 digits if provided',
      'string.max': 'Phone cannot exceed 15 digits if provided',
    }),
  address: Joi.string().optional().allow(null, ''), // Consider if this is still used or replaced by ShippingAddress
  imgUrl: Joi.string().uri().optional().allow(null, '').messages({ // Validate as URI if it's a URL
      'string.uri': 'Image URL must be a valid URL if provided',
  }),
  gender: Joi.string().optional().allow(null, ''), // Add specific values if it's an enum e.g., .valid('Male', 'Female', 'Other')
  dob: Joi.date().iso().optional().allow(null).messages({ // ISO 8601 date format (YYYY-MM-DD)
      'date.format': 'Date of birth must be in YYYY-MM-DD format if provided',
  }),
}).min(1); // Ensure at least one field is provided for update

// Schema for admin updating user information (potentially more fields)
// Example: Admin might be able to change roles
export const adminUpdateUserSchema = Joi.object({
    name: Joi.string().optional().allow(''),
    phone: Joi.string().optional().allow(null, '').pattern(/^[0-9]+$/).min(10).max(15),
    address: Joi.string().optional().allow(null, ''),
    imgUrl: Joi.string().uri().optional().allow(null, ''),
    gender: Joi.string().optional().allow(null, ''),
    dob: Joi.date().iso().optional().allow(null),
    role: Joi.string().valid('CUSTOMER', 'STAFF', 'ADMIN').optional(), // Example: Allow role update
    // Add other fields admin can update
}).min(1);
