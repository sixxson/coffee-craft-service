import Joi from "joi";

// Schema for Product Image
const productImageSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    "string.uri": "Image URL must be a valid URI",
    "any.required": "Image URL is required",
  }),
  order: Joi.number().integer().min(0).optional(),
  isThumbnail: Joi.boolean().optional().default(false),
});

// Schema for Tag (assuming tag names are passed)
const tagSchema = Joi.string().optional().allow(null);

// Schema for Product Variant
const productVariantSchema = Joi.object({
  sku: Joi.string().optional().allow(null, ""), // Optional, might be generated
  price: Joi.number().positive().required().messages({
    "number.base": "Variant price must be a number",
    "number.positive": "Variant price must be a positive number",
    "any.required": "Variant price is required",
  }),
  discountPrice: Joi.number().positive().optional().allow(null).messages({
    "number.base": "Variant discount price must be a number",
    "number.positive": "Variant discount price must be a positive number",
  }),
  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Variant stock must be a number",
    "number.integer": "Variant stock must be an integer",
    "number.min": "Variant stock cannot be negative",
    "any.required": "Variant stock is required",
  }),
  name: Joi.string().required().messages({
    // e.g., "Red, Large"
    "string.empty": "Variant name cannot be empty",
    "any.required": "Variant name is required",
  }),
  color: Joi.string().optional().allow(null, ""),
  weight: Joi.string().optional().allow(null, ""),
  material: Joi.string().optional().allow(null, ""),
});

// Schema for creating a new product
export const createProductSchema = Joi.object({
  sku: Joi.string().required().messages({
    // Added SKU
    "string.empty": "SKU cannot be empty",
    "any.required": "SKU is required",
  }),
  name: Joi.string().required().messages({
    "string.empty": "Product name cannot be empty",
    "any.required": "Product name is required",
  }),
  shortDescription: Joi.string().optional().allow(""), // Added shortDescription
  longDescription: Joi.string().optional().allow(""), // Added longDescription
  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required",
  }),
  discountPrice: Joi.number().positive().optional().allow(null).messages({
    // Added discountPrice
    "number.base": "Discount price must be a number",
    "number.positive": "Discount price must be a positive number",
  }),
  categoryId: Joi.string().uuid().required().messages({
    "string.guid": "Category ID must be a valid UUID",
    "any.required": "Category ID is required",
  }),
  brandId: Joi.string().uuid().optional().messages({
    "string.guid": "Brand ID must be a valid UUID",
  }),
  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),
  active: Joi.boolean().optional().default(true),
  images: Joi.array().items(productImageSchema).optional().min(1).messages({
    // Added images validation
    "array.base": "Images must be an array",
    "array.min": "At least one image is required if images array is provided",
  }),
  tags: Joi.array().items(tagSchema).optional().messages({
    // Added tags validation
    "array.base": "Tags must be an array of strings",
  }),
  variants: Joi.array().items(productVariantSchema).optional().messages({
    // Added variants validation
    "array.base": "Variants must be an array",
  }),
  // avgRating is calculated on the backend
});

// Schema for updating an existing product
export const updateProductSchema = Joi.object({
  sku: Joi.string().optional().messages({
    // Added optional SKU
    "string.empty": "SKU cannot be empty if provided",
  }),
  name: Joi.string().optional().messages({
    "string.empty": "Product name cannot be empty if provided",
  }),
  shortDescription: Joi.string().optional().allow(null, ""),
  longDescription: Joi.string().optional().allow(null, ""),
  price: Joi.number().positive().optional().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
  }),
  discountPrice: Joi.number().positive().optional().allow(null).messages({
    // Added optional discountPrice
    "number.base": "Discount price must be a number",
    "number.positive": "Discount price must be a positive number",
  }),
  categoryId: Joi.string().uuid().optional().messages({
    "string.guid": "Category ID must be a valid UUID",
  }),
  brandId: Joi.string().uuid().optional().allow(null, "").messages({
    "string.guid": "Brand ID must be a valid UUID",
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
  }),
  active: Joi.boolean().optional(),
  images: Joi.array().items(productImageSchema).optional().min(1).messages({
    // Added optional images validation
    "array.base": "Images must be an array",
    "array.min": "At least one image is required if images array is provided",
  }),
  tags: Joi.array().items(tagSchema).optional().messages({
    // Added optional tags validation
    "array.base": "Tags must be an array of strings",
  }),
  variants: Joi.array().items(productVariantSchema).optional().messages({
    // Added optional variants validation
    "array.base": "Variants must be an array",
  }),
}).min(1); // Ensure at least one field is provided for update
