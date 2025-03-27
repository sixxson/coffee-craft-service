// src/services/order.service.ts
import { PrismaClient, OrderStatus, PaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  userId: string;
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  items: OrderItemInput[];
  voucherCode?: string; // Use code to find voucherId
  note?: string;
}

export const createOrder = async (input: CreateOrderInput) => {
  const { userId, shippingAddressId, paymentMethod, items, voucherCode, note } = input;

  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item.');
  }

  // Use a transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    // 1. Fetch products and calculate initial total & prepare order items
    let calculatedTotal = new Decimal(0);
    const orderItemsData = [];
    const productUpdates = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
      if (!product.active) {
          throw new Error(`Product ${product.name} is not available.`);
      }

      const subTotal = product.price.mul(item.quantity);
      calculatedTotal = calculatedTotal.add(subTotal);

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        subTotal: subTotal,
      });

      // Prepare stock update
      productUpdates.push(
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      );
    }

    // 2. Handle Voucher (if applicable)
    let voucherId: string | undefined = undefined;
    let finalTotal = calculatedTotal;
    let discountAmount = new Decimal(0);

    if (voucherCode) {
      const voucher = await tx.voucher.findUnique({
        where: { code: voucherCode, isActive: true },
      });

      if (!voucher) {
        throw new Error(`Voucher with code ${voucherCode} not found or is inactive.`);
      }
      if (voucher.usedLeft <= 0) {
        throw new Error(`Voucher ${voucherCode} has no uses left.`);
      }
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) {
        throw new Error(`Voucher ${voucherCode} is not valid at this time.`);
      }

      // Calculate discount
      if (voucher.type === 'PERCENT') {
        discountAmount = calculatedTotal.mul(voucher.discountPercent.div(100));
        if (discountAmount.greaterThan(voucher.maxDiscount)) {
          discountAmount = voucher.maxDiscount;
        }
      } else { // FIXED
        discountAmount = voucher.discountPercent; // Assuming discountPercent holds the fixed amount for FIXED type
      }

      finalTotal = calculatedTotal.sub(discountAmount);
      if (finalTotal.lessThan(0)) {
        finalTotal = new Decimal(0); // Total cannot be negative
      }
      voucherId = voucher.id;

      // Decrement voucher usage
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedLeft: { decrement: 1 } },
      });
    }

    // 3. Create the Order
    const newOrder = await tx.order.create({
      data: {
        userId,
        total: finalTotal,
        status: OrderStatus.PENDING, // Default status
        voucherId,
        shippingAddressId,
        orderDate: new Date(),
        paymentMethod,
        note,
        orderItems: {
          create: orderItemsData, // Create associated order items
        },
      },
      include: {
        orderItems: true, // Include items in the returned order
      },
    });

    // 4. Update product stock
    await Promise.all(productUpdates);

    return newOrder;
  });
};

// Basic function to get orders for a user (can be expanded later)
export const getOrdersByUserId = async (userId: string) => {
    return prisma.order.findMany({
        where: { userId },
        include: {
            orderItems: {
                include: {
                    product: {
                        select: { name: true, price: true, images: { where: { isThumbnail: true }, take: 1 } } // Include basic product info
                    }
                }
            },
            shippingAddress: true,
            voucher: { select: { code: true, type: true, discountPercent: true, maxDiscount: true } }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

// Function to get a single order by ID (useful for details view)
export const getOrderById = async (orderId: string, userId?: string) => {
    // Optional userId check to ensure user can only fetch their own orders unless admin/staff
    const whereClause: { id: string; userId?: string } = { id: orderId };
    if (userId) {
        whereClause.userId = userId;
    }

    const order = await prisma.order.findUnique({
        where: whereClause,
        include: {
            orderItems: {
                include: {
                    product: {
                        select: { id: true, name: true, price: true, images: { where: { isThumbnail: true }, take: 1 } }
                    }
                }
            },
            user: { select: { id: true, name: true, email: true } },
            shippingAddress: true,
            voucher: { select: { code: true } }
        }
    });

    if (!order) {
        throw new Error(`Order with ID ${orderId} not found` + (userId ? ` for this user.` : '.'));
    }
    return order;
};

// Function to update order status (typically by Staff/Admin)
export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Validate status value
    if (!Object.values(OrderStatus).includes(status)) {
        throw new Error(`Invalid order status: ${status}`);
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    // Optional: Add more sophisticated status transition logic here
    // (e.g., cannot revert from DELIVERED)
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELED) {
        throw new Error(`Order is already ${order.status} and cannot be updated.`);
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status },
    });
};

// Function to cancel an order (by user or Staff/Admin)
export const cancelOrder = async (orderId: string, userId: string, userRole: string) => {
    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true },
        });

        if (!order) {
            throw new Error(`Order with ID ${orderId} not found.`);
        }

        // Authorization: Check if user owns the order or is Staff/Admin
        if (order.userId !== userId && userRole !== 'ADMIN' && userRole !== 'STAFF') {
            throw new Error('Not authorized to cancel this order.');
        }

        // Check if order can be canceled
        if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
            throw new Error(`Cannot cancel order that is already ${order.status}.`);
        }
        if (order.status === OrderStatus.CANCELED) {
            throw new Error('Order is already canceled.');
        }

        // Update order status to CANCELED
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CANCELED },
        });

        // Restock items
        const productUpdates = order.orderItems.map(item =>
            tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
            })
        );
        await Promise.all(productUpdates);

        // Optional: Handle voucher restoration if applicable (more complex)

        return updatedOrder;
    });
};
