// src/routes/order.routes.ts
import express from 'express';
import {
    handleCreateOrder,
    handleGetMyOrders,
    handleGetOrderById,
    handleUpdateOrderStatus, // Import new handler
    handleCancelOrder        // Import new handler
} from '../controllers/order.controller';
import { authenticate, isStaffOrAdmin } from '../middlewares/auth.middleware'; // Import new middleware

const router = express.Router();

// Apply authentication middleware to all order routes
router.use(authenticate);

// POST /api/orders - Create a new order
router.post('/', handleCreateOrder);

// GET /api/orders/myorders - Get orders for the logged-in user
router.get('/myorders', handleGetMyOrders);

// GET /api/orders/:id - Get a specific order by ID (user must own it or be admin/staff)
router.get('/:id', handleGetOrderById);

// PUT /api/orders/:id/status - Update order status (Staff/Admin only)
router.put('/:id/status', isStaffOrAdmin, handleUpdateOrderStatus);

// PUT /api/orders/:id/cancel - Cancel an order (Owner or Staff/Admin)
router.put('/:id/cancel', handleCancelOrder);


export default router;
