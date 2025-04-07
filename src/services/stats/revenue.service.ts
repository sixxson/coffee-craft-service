import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { getDateRangeFromPeriod, Period } from '../../utils/period.util';
import moment from 'moment-timezone'; // Import moment
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal

const prisma = new PrismaClient();

interface PeriodQuery {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate?: string;
  endDate?: string;
}

interface RevenueSummary {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface RevenueByPaymentMethod {
  paymentMethod: PaymentMethod;
  totalRevenue: number;
  orderCount: number;
}

interface OrdersByStatus {
  status: OrderStatus;
  orderCount: number;
  totalValue: number;
}

interface OrdersByPaymentStatus {
  paymentStatus: PaymentStatus;
  orderCount: number;
  totalValue: number;
}

interface OrderFinancials {
    startDate: Date;
    endDate: Date;
    totalShippingFee: number;
    totalDiscountAmount: number;
}


// Function for Revenue Summary
export const getRevenueSummary = async (query: PeriodQuery): Promise<RevenueSummary> => {
  const { startDate, endDate } = getDateRangeFromPeriod(query.period, query.startDate, query.endDate);

  const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

  const aggregation = await prisma.order.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: relevantStatuses,
      },
    },
    _sum: {
      finalTotal: true,
    },
    _count: {
      id: true, // Count orders by their ID
    },
  });

  const totalRevenue = aggregation._sum.finalTotal?.toNumber() || 0;
  const totalOrders = aggregation._count.id || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    startDate,
    endDate,
    totalRevenue,
    totalOrders,
    averageOrderValue,
  };
};

// Function for Revenue By Payment Method
export const getRevenueByPaymentMethod = async (query: PeriodQuery): Promise<RevenueByPaymentMethod[]> => {
    const { startDate, endDate } = getDateRangeFromPeriod(query.period, query.startDate, query.endDate);

    // Consider only orders that contribute to revenue
    const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    const results = await prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
             status: {
                 in: relevantStatuses,
             },
        },
        _sum: {
            finalTotal: true,
        },
        _count: {
            id: true,
        },
    });

    // Map results and ensure all payment methods are present
    const allPaymentMethods = Object.values(PaymentMethod);
    const revenueMap = new Map<PaymentMethod, { totalRevenue: number; orderCount: number }>();

    results.forEach(result => {
        revenueMap.set(result.paymentMethod, {
            totalRevenue: result._sum.finalTotal?.toNumber() || 0,
            orderCount: result._count.id || 0,
        });
    });

    const finalData = allPaymentMethods.map(method => ({
        paymentMethod: method,
        totalRevenue: revenueMap.get(method)?.totalRevenue || 0,
        orderCount: revenueMap.get(method)?.orderCount || 0,
    }));

    return finalData;
};

// Function for Orders By Status
export const getOrdersByStatus = async (query: PeriodQuery): Promise<OrdersByStatus[]> => {
    const { startDate, endDate } = getDateRangeFromPeriod(query.period, query.startDate, query.endDate);

    const results = await prisma.order.groupBy({
        by: ['status'],
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: {
            finalTotal: true,
        },
        _count: {
            id: true,
        },
    });

    // Map results and ensure all statuses are present
    const allStatuses = Object.values(OrderStatus);
    const statusMap = new Map<OrderStatus, { orderCount: number; totalValue: number }>();

    results.forEach(result => {
        statusMap.set(result.status, {
            orderCount: result._count.id || 0,
            totalValue: result._sum.finalTotal?.toNumber() || 0,
        });
    });

    const finalData = allStatuses.map(status => ({
        status: status,
        orderCount: statusMap.get(status)?.orderCount || 0,
        totalValue: statusMap.get(status)?.totalValue || 0,
    }));

    return finalData;
};

// Function for Orders By Payment Status
export const getOrdersByPaymentStatus = async (query: PeriodQuery): Promise<OrdersByPaymentStatus[]> => {
    const { startDate, endDate } = getDateRangeFromPeriod(query.period, query.startDate, query.endDate);

    const results = await prisma.order.groupBy({
        by: ['paymentStatus'],
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: {
            finalTotal: true,
        },
        _count: {
            id: true,
        },
    });

    // Map results and ensure all payment statuses are present
    const allPaymentStatuses = Object.values(PaymentStatus);
    const statusMap = new Map<PaymentStatus, { orderCount: number; totalValue: number }>();

    results.forEach(result => {
        statusMap.set(result.paymentStatus, {
            orderCount: result._count.id || 0,
            totalValue: result._sum.finalTotal?.toNumber() || 0,
        });
    });

    const finalData = allPaymentStatuses.map(status => ({
        paymentStatus: status,
        orderCount: statusMap.get(status)?.orderCount || 0,
        totalValue: statusMap.get(status)?.totalValue || 0,
    }));

    return finalData;
};

// --- Updated types for Order Trend ---
interface OrderTrendDataPoint {
    date: string; // Format depends on groupBy (e.g., YYYY-MM-DD, YYYY-MM, YYYY)
    count: number;
    totalRevenue: Decimal; // Added total revenue
}

interface OrderTrendResult {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'month' | 'year';
    data: OrderTrendDataPoint[];
}

// Function for Order Creation Trend
export const getOrderCreationTrend = async (
    groupBy: 'day' | 'month' | 'year',
    period?: Period,
    customStartDate?: string,
    customEndDate?: string
): Promise<OrderTrendResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);

    // Fetch orders within the date range
    const orders = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            // Optional: Add status filter if needed (e.g., exclude CANCELED)
            // status: {
            //     not: OrderStatus.CANCELED
            // }
        },
        select: {
            createdAt: true,
            finalTotal: true, // Select finalTotal as well
        },
        orderBy: {
            createdAt: 'asc',
        }
    });

    const groupedData: { [key: string]: { count: number; totalRevenue: Decimal } } = {};

    orders.forEach(order => {
        let key: string;
        const createdAtMoment = moment(order.createdAt); // Use moment for formatting

        switch (groupBy) {
            case 'month':
                key = createdAtMoment.format('YYYY-MM');
                break;
            case 'year':
                key = createdAtMoment.format('YYYY');
                break;
            case 'day':
            default:
                key = createdAtMoment.format('YYYY-MM-DD');
                break;
        }

        if (!groupedData[key]) {
            groupedData[key] = { count: 0, totalRevenue: new Decimal(0) };
        }
        groupedData[key].count += 1;
        groupedData[key].totalRevenue = groupedData[key].totalRevenue.add(order.finalTotal);
    });

    const data: OrderTrendDataPoint[] = Object.entries(groupedData).map(([dateKey, values]) => ({
        date: dateKey,
        count: values.count,
        totalRevenue: values.totalRevenue, // Include totalRevenue
    }));

    // Ensure chronological order
    data.sort((a, b) => a.date.localeCompare(b.date));

    return {
        startDate,
        endDate,
        groupBy,
        data,
    };
};

// Function for Order Financials
export const getOrderFinancials = async (query: PeriodQuery): Promise<OrderFinancials> => {
    const { startDate, endDate } = getDateRangeFromPeriod(query.period, query.startDate, query.endDate);

    // Consider only orders that contribute to revenue/costs
    const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    const aggregation = await prisma.order.aggregate({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
             status: {
                 in: relevantStatuses, // Optional: Filter if financials should only count for completed/shipped orders
             },
        },
        _sum: {
            shippingFee: true,
            discountAmount: true,
        },
    });

    return {
        startDate,
        endDate,
        totalShippingFee: aggregation._sum.shippingFee?.toNumber() || 0,
        totalDiscountAmount: aggregation._sum.discountAmount?.toNumber() || 0,
    };
};