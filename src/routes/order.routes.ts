// src/routes/order.routes.ts
import express from "express";
import {
  handleCreateOrder, // Keep one
  // handleCreateOrder, // Remove duplicate
  handleGetMyOrders,
  handleGetOrderById,
  handleUpdateOrderStatus,
  handleCancelOrder,
  handleGetAllOrders, // Import the new handler
} from "../controllers/order.controller";
import { authenticate, isStaffOrAdmin } from "../middlewares/auth.middleware";
import { validateRequestBody } from "../middlewares/validation.middleware";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updateOrderPaymentStatusSchema // Import payment status schema
} from "../validations/order.validation";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItemInput:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *         productVariantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         quantity:
 *           type: integer
 *           minimum: 1
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         total:
 *           type: number
 *           format: float # Or string if using Decimal directly
 *           description: Original total before discounts/fees
 *         shippingFee:
 *           type: number
 *           format: float
 *         discountAmount:
 *           type: number
 *           format: float
 *         finalTotal:
 *           type: number
 *           format: float
 *           description: Actual amount charged
 *         status:
 *           $ref: '#/components/schemas/OrderStatus' # Define OrderStatus enum below
 *         paymentStatus:
 *           $ref: '#/components/schemas/PaymentStatus' # Define PaymentStatus enum below
 *         voucherId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         shippingAddressId:
 *           type: string
 *           format: uuid
 *         paymentMethod:
 *           $ref: '#/components/schemas/PaymentMethod' # Define PaymentMethod enum below
 *         note:
 *           type: string
 *           nullable: true
 *         transactionId:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         orderItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem' # Define OrderItem schema below
 *         user: # Included in some responses
 *           $ref: '#/components/schemas/UserSafe'
 *         shippingAddress: # Included in some responses
 *           $ref: '#/components/schemas/ShippingAddress' # Define ShippingAddress schema
 *         voucher: # Included in some responses
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         orderId:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         productVariantId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         quantity:
 *           type: integer
 *         priceAtOrder:
 *           type: number
 *           format: float
 *         subTotal:
 *           type: number
 *           format: float
 *         discountAmount:
 *           type: number
 *           format: float
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         product: # Included in some responses
 *           type: object # Define simplified product if needed
 *         productVariant: # Included in some responses
 *           type: object # Define simplified variant if needed
 *     OrderStatus:
 *       type: string
 *       enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELED]
 *     PaymentStatus:
 *       type: string
 *       enum: [PENDING, PAID, FAILED, REFUNDED]
 *     PaymentMethod:
 *       type: string
 *       enum: [COD, CREDIT_CARD, VNPAY]
 *     ShippingAddress: # Example definition
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         address:
 *           type: string
 *         receiverName:
 *           type: string
 *         receiverPhone:
 *           type: string
 *     UserSafe: # Example definition
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           format: email
 */

// Apply authentication middleware to all order routes
router.use(authenticate);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Retrieve a list of all orders (Admin/Staff only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: 'createdAt' }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: 'desc' }
 *       - in: query
 *         name: status
 *         schema: { $ref: '#/components/schemas/OrderStatus' }
 *       - in: query
 *         name: paymentStatus
 *         schema: { $ref: '#/components/schemas/PaymentStatus' }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: A list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order' # Adjust based on actual response structure
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", isStaffOrAdmin, handleGetAllOrders);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddressId
 *               - paymentMethod
 *               - items
 *             properties:
 *               shippingAddressId:
 *                 type: string
 *                 format: uuid
 *               paymentMethod:
 *                 $ref: '#/components/schemas/PaymentMethod'
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/OrderItemInput'
 *                 minItems: 1
 *               voucherCode:
 *                 type: string
 *               note:
 *                 type: string
 *               shippingFee:
 *                 type: number
 *                 format: float
 *                 default: 0
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error, insufficient stock, invalid voucher, etc.
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product, Variant, or Shipping Address not found.
 */
router.post("/", validateRequestBody(createOrderSchema), handleCreateOrder);

/**
 * @swagger
 * /orders/myorders:
 *   get:
 *     summary: Retrieve orders for the current user
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order' # Adjust based on actual response structure
 *       401:
 *         description: Unauthorized
 */
router.get("/myorders", handleGetMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Retrieve a specific order by ID
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the order to retrieve
 *     responses:
 *       200:
 *         description: Order details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User does not own order and is not Admin/Staff)
 *       404:
 *         description: Order not found
 */
router.get("/:id", handleGetOrderById);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update the status of an order (Admin/Staff only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/OrderStatus'
 *     responses:
 *       200:
 *         description: Order status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status or transition not allowed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.put(
  "/:id/status",
  isStaffOrAdmin,
  validateRequestBody(updateOrderStatusSchema),
  handleUpdateOrderStatus
);

/**
 * @swagger
 * /orders/{id}/payment-status:
 *   put:
 *     summary: Update the payment status of an order (Admin/Staff or Callback)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: [] # Or none if used by unauthenticated callback
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the order to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 $ref: '#/components/schemas/PaymentStatus'
 *               transactionId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Order payment status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
// router.put( // Add this route and its controller handler
//   "/:id/payment-status",
//   // isStaffOrAdmin, // May need adjustment for callbacks
//   validateRequestBody(updateOrderPaymentStatusSchema),
//   handleUpdateOrderPaymentStatus // Create this controller handler
// );


/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order (Owner or Admin/Staff)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *       # - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the order to cancel
 *     responses:
 *       200:
 *         description: Order canceled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order' # Returns the updated order
 *       400:
 *         description: Order cannot be canceled (e.g., already shipped)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.put("/:id/cancel", handleCancelOrder);

export default router;
