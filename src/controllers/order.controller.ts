// src/controllers/order.controller.ts
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import {
    createOrder,
    getOrdersByUserId,
    getOrderById,
    updateOrderStatus,
    cancelOrder
} from '../services/order.service';
import { PaymentMethod, OrderStatus } from '@prisma/client'; // Import enums


// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer)
export const handleCreateOrder = asyncHandler(async (req: Request, res: Response) => {
    const { shippingAddressId, paymentMethod, items, voucherCode, note } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user
    const userRole = req.user.role; // Get role

    if (!userId) { // This check might be redundant if middleware guarantees user
        res.status(401);
        throw new Error('Not authorized, user ID not found');
    }

    if (!shippingAddressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400);
        throw new Error('Missing required order fields: shippingAddressId, paymentMethod, and items array');
    }

    // Basic validation for payment method enum
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        res.status(400);
        throw new Error(`Invalid payment method: ${paymentMethod}`);
    }

    // Basic validation for items structure
    for (const item of items) {
        if (!item.productId || !item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
            res.status(400);
            throw new Error('Invalid items structure: Each item must have productId and a positive quantity.');
        }
    }

    try {
        const orderInput = {
            userId,
            shippingAddressId,
            paymentMethod,
            items,
            voucherCode,
            note,
        };
        const createdOrder = await createOrder(orderInput);
        res.status(201).json(createdOrder);
    } catch (error: any) {
        // Catch specific errors from service if needed (e.g., stock issues)
        res.status(400); // Bad request for issues like insufficient stock, invalid voucher
        throw new Error(error.message || 'Failed to create order');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private (Customer)
export const handleGetMyOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id; // Assuming user is guaranteed by middleware

    if (!userId) { // Redundant check?
        res.status(401);
        throw new Error('Not authorized, user ID not found'); // Should not happen if middleware works
    }

    const orders = await getOrdersByUserId(userId);
    res.status(200).json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Customer owns order, or Admin/Staff)
export const handleGetOrderById = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const userId = req.user.id; // Assuming user is guaranteed by middleware
    const userRole = req.user.role;

    if (!userId) { // Redundant check?
        res.status(401);
        throw new Error('Not authorized, user ID not found'); // Should not happen if middleware works
    }

    try {
        // Allow Admin/Staff to view any order, otherwise check ownership
        const order = await getOrderById(orderId, ['ADMIN', 'STAFF'].includes(userRole || '') ? undefined : userId);
        res.status(200).json(order);
    } catch (error: any) {
        res.status(404); // Not found if order doesn't exist or user doesn't have access
        throw new Error(error.message || 'Order not found');
    }
});


// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Staff/Admin)
export const handleUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const { status } = req.body; // Expect status in the request body

    if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400);
        throw new Error(`Invalid or missing status: ${status}`);
    }

    try {
        const updatedOrder = await updateOrderStatus(orderId, status);
        res.status(200).json(updatedOrder);
    } catch (error: any) {
        res.status(400); // Or 404 if order not found
        throw new Error(error.message || 'Failed to update order status');
    }
});

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Owner or Staff/Admin)
export const handleCancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!userId || !userRole) {
         // Should be guaranteed by authenticate middleware
        res.status(401);
        throw new Error('Authentication details missing.');
    }

    try {
        const canceledOrder = await cancelOrder(orderId, userId, userRole);
        res.status(200).json(canceledOrder);
    } catch (error: any) {
        res.status(400); // Or 403 for auth error, 404 for not found
        throw new Error(error.message || 'Failed to cancel order');
    }
});
