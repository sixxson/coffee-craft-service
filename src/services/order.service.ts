// src/services/order.service.ts
import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus, Product, ProductVariant, UserRole } from "@prisma/client"; // Added PaymentStatus, Product, ProductVariant, UserRole
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

interface OrderItemInput {
  productId: string;
  productVariantId?: string; // Added optional variant ID
  quantity: number;
}

interface CreateOrderInput {
  userId: string;
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  items: OrderItemInput[];
  voucherCode?: string;
  note?: string;
  // shippingFee should ideally be calculated based on address/method, passed in, or fetched. Defaulting to 0 for now.
  shippingFee?: Decimal | number;
}

export const createOrder = async (input: CreateOrderInput) => {
  // Destructure shippingFee with default
  const { userId, shippingAddressId, paymentMethod, items, voucherCode, note, shippingFee = 0 } = input;

  if (!items || items.length === 0) {
    throw new Error("Order must contain at least one item.");
  }

  // Use a transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    // 1. Fetch products/variants, calculate total, prepare items & stock updates
    let calculatedTotal = new Decimal(0); // Price before discounts/fees
    const orderItemsData = [];
    const stockUpdates = []; // Can be product or variant updates

    // Fetch all products/variants at once for efficiency
    const productIds = items.map(item => item.productId);
    const variantIds = items.filter(item => item.productVariantId).map(item => item.productVariantId!);

    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: { category: { select: { id: true } } } // Needed for voucher check
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    const variants = variantIds.length > 0 ? await tx.productVariant.findMany({
      where: { id: { in: variantIds } }
    }) : [];
    const variantMap = new Map(variants.map(v => [v.id, v]));


    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product with ID ${item.productId} not found.`);
      if (!product.active) throw new Error(`Product ${product.name} is not available.`);

      let price: Decimal;
      let stock: number;
      let stockUpdatePromise;

      if (item.productVariantId) {
        const variant = variantMap.get(item.productVariantId);
        if (!variant) throw new Error(`Variant with ID ${item.productVariantId} not found for product ${product.name}.`);
        if (variant.productId !== item.productId) throw new Error(`Variant ${item.productVariantId} does not belong to product ${item.productId}.`);

        price = variant.discountPrice ?? variant.price; // Use variant price (check discount first)
        stock = variant.stock;
        if (stock < item.quantity) throw new Error(`Insufficient stock for variant ${variant.name} of product ${product.name}. Available: ${stock}, Requested: ${item.quantity}`);

        // Prepare variant stock update
        stockUpdatePromise = tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { decrement: item.quantity } },
        });

      } else {
        // Use base product details
        price = product.discountPrice ?? product.price; // Check discount price first
        stock = product.stock;
        if (stock < item.quantity) throw new Error(`Insufficient stock for product ${product.name}. Available: ${stock}, Requested: ${item.quantity}`);

        // Prepare product stock update
        stockUpdatePromise = tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const subTotal = price.mul(item.quantity);
      calculatedTotal = calculatedTotal.add(subTotal);

      orderItemsData.push({
        productId: item.productId,
        productVariantId: item.productVariantId, // Add variant ID
        quantity: item.quantity,
        priceAtOrder: price, // Use actual price (product or variant)
        subTotal: subTotal,
        discountAmount: new Decimal(0), // Default item discount to 0, assuming order-level voucher
      });

      stockUpdates.push(stockUpdatePromise);
    }

    // 2. Handle Voucher (if applicable)
    let voucherId: string | null = null;
    let calculatedDiscountAmount = new Decimal(0); // Renamed to avoid conflict with schema field
    const calculatedShippingFee = new Decimal(shippingFee); // Ensure Decimal

    if (voucherCode) {
      const voucher = await tx.voucher.findUnique({
        where: { code: voucherCode, isActive: true },
        include: { applicableCategories: { select: { id: true } }, excludedProducts: { select: { id: true } } } // Include relations for checks
      });

      if (!voucher) throw new Error(`Voucher with code ${voucherCode} not found or is inactive.`);
      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) throw new Error(`Voucher ${voucherCode} usage limit reached.`);
      const now = new Date();
      if (now < voucher.startDate || now > voucher.endDate) throw new Error(`Voucher ${voucherCode} is not valid at this time.`);
      if (voucher.minimumOrderValue && calculatedTotal.lessThan(voucher.minimumOrderValue)) throw new Error(`Order total (${calculatedTotal}) does not meet minimum requirement of ${voucher.minimumOrderValue} for voucher ${voucherCode}.`);

      // Check product/category restrictions
      let isApplicable = true;
      const excludedProductIds = new Set(voucher.excludedProducts.map(p => p.id));
      if (items.some(item => excludedProductIds.has(item.productId))) {
          isApplicable = false;
          throw new Error(`Voucher ${voucherCode} cannot be applied because one or more items in the cart are excluded.`);
      }

      if (isApplicable && voucher.applicableCategories.length > 0) {
          const applicableCategoryIds = new Set(voucher.applicableCategories.map(c => c.id));
          // Ensure *all* applicable items (not excluded) belong to the allowed categories
          const applicableItemsCategoryIds = items
              .filter(item => !excludedProductIds.has(item.productId)) // Filter out excluded items first
              .map(item => productMap.get(item.productId)?.categoryId)
              .filter(Boolean) as string[];

          if (applicableItemsCategoryIds.length === 0 || !applicableItemsCategoryIds.every(catId => applicableCategoryIds.has(catId))) {
               isApplicable = false;
               throw new Error(`Voucher ${voucherCode} is not applicable to all eligible categories of items in the cart.`);
          }
      }


      if (isApplicable) {
          // Calculate discount
          if (voucher.type === "PERCENT" && voucher.discountPercent) {
            calculatedDiscountAmount = calculatedTotal.mul(voucher.discountPercent.div(100));
            if (voucher.maxDiscount && calculatedDiscountAmount.greaterThan(voucher.maxDiscount)) {
              calculatedDiscountAmount = voucher.maxDiscount;
            }
          } else if (voucher.type === "FIXED" && voucher.discountAmount) {
            calculatedDiscountAmount = voucher.discountAmount;
          } else {
             console.error(`Invalid voucher configuration for code ${voucherCode}`);
             throw new Error(`Invalid voucher configuration.`);
          }

          // Ensure discount doesn't exceed total
          if (calculatedDiscountAmount.greaterThan(calculatedTotal)) {
              calculatedDiscountAmount = calculatedTotal;
          }

          voucherId = voucher.id;

          // Increment voucher usage count
          await tx.voucher.update({
            where: { id: voucher.id },
            data: { usedCount: { increment: 1 } }, // Use increment
          });
      } else {
           throw new Error(`Voucher ${voucherCode} cannot be applied to this order based on item restrictions.`);
      }
    }

     // Calculate final total
    let finalTotal = calculatedTotal.sub(calculatedDiscountAmount).add(calculatedShippingFee);
     if (finalTotal.lessThan(0)) {
        finalTotal = new Decimal(0); // Total cannot be negative
      }

    // 3. Create the Order
    const newOrder = await tx.order.create({
      data: {
        userId,
        total: calculatedTotal, // Original total before discounts/fees
        shippingFee: calculatedShippingFee, // Store shipping fee
        discountAmount: calculatedDiscountAmount, // Store discount amount
        finalTotal: finalTotal, // Actual amount charged
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING, // Default payment status
        voucherId,
        shippingAddressId,
        paymentMethod,
        note,
        // transactionId will be set upon payment confirmation
        orderItems: {
          create: orderItemsData,
        },
      },
      include: { // Include details in the response
        orderItems: {
            include: {
                product: { select: { id: true, name: true, sku: true, images: { where: { isThumbnail: true }, take: 1, select: { url: true } } } },
                productVariant: { select: { id: true, name: true, sku: true } }
            }
        },
        shippingAddress: true,
        voucher: { select: { code: true } },
        user: { select: { id: true, name: true, email: true } }
      },
    });

    // 4. Execute stock updates
    await Promise.all(stockUpdates);

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
            select: {
              id: true, // Keep id for linking
              name: true,
              sku: true, // Add sku
              images: { where: { isThumbnail: true }, take: 1, select: { url: true } }, // Select URL
            },
          },
          productVariant: { // Include variant details
             select: {
                id: true,
                name: true,
                sku: true,
                color: true,
                weight: true,
                material: true,
             }
          }
        },
      },
      shippingAddress: true,
      voucher: {
        select: {
          code: true,
          type: true,
          discountPercent: true,
          discountAmount: true, // Added
          maxDiscount: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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
            select: {
              id: true,
              name: true,
              sku: true, // Add sku
              images: { where: { isThumbnail: true }, take: 1, select: { url: true } }, // Select URL
            },
          },
           productVariant: { // Include variant details
             select: {
                id: true,
                name: true,
                sku: true,
                color: true,
                weight: true,
                material: true,
             }
          }
        },
      },
      user: { select: { id: true, name: true, email: true } },
      shippingAddress: true,
      voucher: { select: { code: true } },
    },
  });

  if (!order) {
    throw new Error(
      `Order with ID ${orderId} not found` + (userId ? ` for this user.` : ".")
    );
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

  // Prevent status update if order is already delivered or canceled
  if (
    order.status === OrderStatus.DELIVERED ||
    order.status === OrderStatus.CANCELED
  ) {
    throw new Error(`Order is already ${order.status} and cannot be updated.`);
  }

  // Add logic for specific transitions if needed (e.g., payment required before shipping)

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
};

// Function to update order payment status (e.g., after webhook callback)
export const updateOrderPaymentStatus = async (orderId: string, paymentStatus: PaymentStatus, transactionId?: string) => {
   if (!Object.values(PaymentStatus).includes(paymentStatus)) {
    throw new Error(`Invalid payment status: ${paymentStatus}`);
  }

   const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

   if (!order) {
    throw new Error(`Order with ID ${orderId} not found.`);
  }

   // Prevent updates if already paid/refunded? (Depends on business logic)
   // if (order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.REFUNDED) {
   //   throw new Error(`Order payment status is already ${order.paymentStatus}.`);
   // }

   return prisma.order.update({
    where: { id: orderId },
    data: {
        paymentStatus,
        transactionId: transactionId ?? order.transactionId, // Keep existing if not provided
     },
  });
};


// Function to get ALL orders (for Admin/Staff) - Consider adding pagination/filtering
export const getAllOrders = async (options: any = {}) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, paymentStatus, userId } = options;

  const where: any = {};
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (userId) where.userId = userId;


  const orders = await prisma.order.findMany({
    where,
    skip: (page - 1) * limit,
    take: parseInt(limit),
    include: {
      user: { select: { id: true, name: true, email: true } }, // Include basic user info
      _count: { select: { orderItems: true } } // Count items
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const totalOrders = await prisma.order.count({ where });

  return { data: orders, total: totalOrders, page, limit };
};

// Function to cancel an order (by user or Staff/Admin)
export const cancelOrder = async (orderId: string, userId: string, userRole: UserRole) => { // Use UserRole enum
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }, // Include items to restock
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found.`);
    }

    // Authorization: Check if user owns the order or is Staff/Admin
    if (
      order.userId !== userId &&
      userRole !== UserRole.ADMIN && // Use enum
      userRole !== UserRole.STAFF   // Use enum
    ) {
      throw new Error("Not authorized to cancel this order.");
    }

    // Check if order can be canceled (e.g., before shipping)
    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new Error(`Cannot cancel order that is already ${order.status}.`);
    }
    if (order.status === OrderStatus.CANCELED) {
      throw new Error("Order is already canceled.");
    }

    // Update order status to CANCELED
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
          status: OrderStatus.CANCELED,
          // Optionally update payment status if applicable (e.g., to REFUNDED if paid)
          // paymentStatus: order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus
      },
    });

    // Restock items (handle both products and variants)
    const stockRestores = order.orderItems.map((item) => {
      if (item.productVariantId) {
        return tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        return tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
    await Promise.all(stockRestores);

    // Optional: Handle voucher restoration if applicable (e.g., increment usedCount back)
    if (order.voucherId) {
        // Simple restoration - might need more complex logic depending on rules
        await tx.voucher.update({
            where: { id: order.voucherId },
            data: { usedCount: { decrement: 1 } } // Decrement usage count back
        });
    }

    // Optional: Trigger refund process if order was paid

    return updatedOrder;
  });
};
