import Joi from 'joi';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client'; // Import enums

// Schema for a single order item within the create order request
const orderItemSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.guid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required for each item',
  }),
  productVariantId: Joi.string().uuid().optional().allow(null, '').messages({ // Added optional productVariantId
    'string.guid': 'Product Variant ID must be a valid UUID',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required for each item',
  }),
  // priceAtOrder, subTotal, discountAmount are calculated on the backend
});

// Schema for creating a new order
export const createOrderSchema = Joi.object({
  shippingAddressId: Joi.string().uuid().required().messages({
    'string.guid': 'Shipping Address ID must be a valid UUID',
    'any.required': 'Shipping Address ID is required',
  }),
  paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethod)) // Validate against enum values
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required',
    }),
  voucherId: Joi.string().uuid().optional().allow(null, ''), // Optional voucher
  note: Joi.string().optional().allow(''),
  orderItems: Joi.array()
    .items(orderItemSchema)
    .min(1) // Must have at least one item
    .required()
    .messages({
      'array.base': 'Order items must be an array',
      'array.min': 'Order must contain at least one item',
      'any.required': 'Order items are required',
    }),
  // total is calculated on the backend
  // userId is taken from authenticated user
  // status defaults to PENDING
});

// Schema for updating order status (e.g., by admin/staff)
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus)) // Validate against enum values
    .required()
    .messages({
      'any.only': 'Invalid order status',
      'any.required': 'Order status is required',
    }),
});

// Schema for updating order payment status (e.g., by admin/staff or payment gateway callback)
export const updateOrderPaymentStatusSchema = Joi.object({
  paymentStatus: Joi.string()
    .valid(...Object.values(PaymentStatus)) // Validate against enum values
    .required()
    .messages({
      'any.only': 'Invalid payment status',
      'any.required': 'Payment status is required',
    }),
  transactionId: Joi.string().optional().allow(null, ''), // Optional transaction ID
});
