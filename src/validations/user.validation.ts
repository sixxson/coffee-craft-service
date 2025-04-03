import Joi from "joi";
import { GENDER } from "@prisma/client"; // Import GENDER enum

// Schema for user registration
export const registerUserSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required',
    }),
    name: Joi.string().optional().allow(''),
});

// Schema for user login
export const loginUserSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required',
    }),
});


// Schema for updating user profile information (by the user themselves)
export const updateUserProfileSchema = Joi.object({
  name: Joi.string().optional().allow("").messages({
    "string.empty": "Name cannot be empty if provided",
  }),
  phone: Joi.string()
    .optional()
    .allow(null, "") // Allow null or empty string to clear the phone number
    .pattern(/^[0-9]+$/)
    .min(10)
    .max(15)
    .messages({
      "string.pattern.base": "Phone must contain only digits if provided",
      "string.min": "Phone must be at least 10 digits if provided",
      "string.max": "Phone cannot exceed 15 digits if provided",
    }),
  address: Joi.string().optional().allow(null, ""), // Consider if this is still used or replaced by ShippingAddress
  imgUrl: Joi.string().uri().optional().allow(null, "").messages({
    // Validate as URI if it's a URL
    "string.uri": "Image URL must be a valid URL if provided",
  }),
  gender: Joi.string().valid(...Object.values(GENDER)).optional().allow(null, "").messages({ // Use GENDER enum
    "any.only": "Invalid gender value",
  }),
  dob: Joi.date().iso().optional().allow(null).messages({
    // ISO 8601 date format (YYYY-MM-DD)
    "date.format": "Date of birth must be in YYYY-MM-DD format if provided",
  }),
  password: Joi.string().optional().allow("").min(6).messages({
    "string.min": "Password must be at least 6 characters long if provided",
  }),
  oldPassword: Joi.string().optional().allow(""),
  role: Joi.string().valid("CUSTOMER", "STAFF", "ADMIN").optional(), // Example: Allow role update
}).min(1); // Ensure at least one field is provided for update

// Schema for admin updating user information (potentially more fields)
// Example: Admin might be able to change roles
export const adminUpdateUserSchema = Joi.object({
  name: Joi.string().optional().allow(""),
  phone: Joi.string()
    .optional()
    .allow(null, "")
    .pattern(/^[0-9]+$/)
    .min(10)
    .max(15),
  address: Joi.string().optional().allow(null, ""),
  imgUrl: Joi.string().uri().optional().allow(null, ""),
  gender: Joi.string().valid(...Object.values(GENDER)).optional().allow(null, "").messages({ // Use GENDER enum
    "any.only": "Invalid gender value",
  }),
  dob: Joi.date().iso().optional().allow(null),
  isActive: Joi.boolean().optional(), // Added isActive for admin updates
  // emailVerified and lastLogin are typically managed internally
  role: Joi.string().valid("CUSTOMER", "STAFF", "ADMIN").optional(),
}).min(1);
