import { PrismaClient, VoucherType, OrderStatus } from '@prisma/client';
import { getDateRangeFromPeriod, Period } from '../../utils/period.util';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// --- Define Types ---

interface VoucherUsageData {
    voucherId: string;
    code: string;
    type: VoucherType;
    usageCount: number;
    totalDiscountGiven: Decimal;
}

interface VoucherUsageResult {
    startDate: Date;
    endDate: Date;
    limit: number;
    sortBy: 'usageCount' | 'totalDiscount';
    data: VoucherUsageData[];
}

interface VoucherEffectivenessData {
    voucherId: string;
    code: string;
    type: VoucherType;
    usageCount: number;
    totalDiscountGiven: Decimal;
    totalRevenueFromOrders: Decimal; // Revenue from orders using this voucher
}

interface VoucherEffectivenessResult {
    startDate: Date;
    endDate: Date;
    data: VoucherEffectivenessData[]; // Array even if filtered by single code
}


// --- Service Functions ---

// Function for Voucher Usage
export const getVoucherUsage = async (
    limit: number,
    sortBy: 'usageCount' | 'totalDiscount',
    period?: Period,
    customStartDate?: string,
    customEndDate?: string
): Promise<VoucherUsageResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);

    // Define relevant order statuses
    const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    // Aggregate orders grouped by voucherId (without ordering here)
    const aggregation = await prisma.order.groupBy({
        by: ['voucherId'],
        where: {
            voucherId: { not: null }, // Only include orders where a voucher was used
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            status: {
                in: relevantStatuses,
            },
        },
        _sum: {
            discountAmount: true,
        },
        _count: {
            id: true, // Count orders
        },
        // Ordering will be done in code after fetching details
    });

    // Filter out potential null voucherId results (though 'where' clause should prevent this)
    const validAggregations = aggregation.filter(agg => agg.voucherId !== null);

    if (validAggregations.length === 0) {
        return { startDate, endDate, limit, sortBy, data: [] };
    }

    // Fetch voucher details for the aggregated results
    const voucherIds = validAggregations.map(agg => agg.voucherId as string); // Assert as string after filtering nulls
    const vouchers = await prisma.voucher.findMany({
        where: {
            id: { in: voucherIds },
        },
        select: {
            id: true,
            code: true,
            type: true,
        },
    });
    const voucherMap = new Map(vouchers.map(v => [v.id, v]));

    // Combine aggregation results with voucher details
    const data: VoucherUsageData[] = validAggregations.map(agg => {
        const voucher = voucherMap.get(agg.voucherId as string);
        return {
            voucherId: agg.voucherId as string,
            code: voucher?.code ?? 'Unknown Code',
            type: voucher?.type ?? VoucherType.FIXED, // Provide a default type if needed
            usageCount: agg._count.id ?? 0,
            totalDiscountGiven: agg._sum.discountAmount ?? new Decimal(0),
        };
    });

    // Sort the combined data in code
    const sortedData = data.sort((a, b) => {
        if (sortBy === 'usageCount') {
            return b.usageCount - a.usageCount; // Descending order
        } else { // sortBy === 'totalDiscount'
            // Use Decimal.js comparison for accuracy
            return b.totalDiscountGiven.comparedTo(a.totalDiscountGiven); // Descending order
        }
    });

    // Apply limit after sorting
    const limitedData = sortedData.slice(0, limit);

    return {
        startDate,
        endDate,
        limit,
        sortBy,
        data: limitedData, // Return the sorted and limited data
    };
};

// Function for Voucher Effectiveness
export const getVoucherEffectiveness = async (
    voucherCode?: string, // Optional filter by specific code
    period?: Period,
    customStartDate?: string,
    customEndDate?: string
): Promise<VoucherEffectivenessResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);

    // Define relevant order statuses
    const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    // Prepare the base 'where' clause for orders
    const orderWhereClause: any = {
        voucherId: { not: null },
        createdAt: {
            gte: startDate,
            lte: endDate,
        },
        status: {
            in: relevantStatuses,
        },
    };

    // If a specific voucher code is provided, find its ID and filter by it
    let targetVoucherIds: string[] | undefined = undefined;
    if (voucherCode) {
        const voucher = await prisma.voucher.findUnique({
            where: { code: voucherCode },
            select: { id: true },
        });
        if (voucher) {
            targetVoucherIds = [voucher.id];
            orderWhereClause.voucherId = voucher.id; // Add specific voucherId to filter
        } else {
            // Voucher code not found, return empty result
            return { startDate, endDate, data: [] };
        }
    }

    // Aggregate orders grouped by voucherId
    const aggregation = await prisma.order.groupBy({
        by: ['voucherId'],
        where: orderWhereClause, // Use the potentially modified where clause
        _sum: {
            discountAmount: true,
            finalTotal: true, // Sum the final total of orders using the voucher
        },
        _count: {
            id: true, // Count orders
        },
    });

    // Filter out potential null voucherId results
    const validAggregations = aggregation.filter(agg => agg.voucherId !== null);

    if (validAggregations.length === 0) {
        return { startDate, endDate, data: [] };
    }

    // Fetch voucher details for the aggregated results
    // If we filtered by a specific code earlier, targetVoucherIds is already set
    const voucherIdsToFetch = targetVoucherIds ?? validAggregations.map(agg => agg.voucherId as string);
    const vouchers = await prisma.voucher.findMany({
        where: {
            id: { in: voucherIdsToFetch },
        },
        select: {
            id: true,
            code: true,
            type: true,
        },
    });
    const voucherMap = new Map(vouchers.map(v => [v.id, v]));

    // Combine aggregation results with voucher details
    const data: VoucherEffectivenessData[] = validAggregations.map(agg => {
        const voucher = voucherMap.get(agg.voucherId as string);
        return {
            voucherId: agg.voucherId as string,
            code: voucher?.code ?? 'Unknown Code',
            type: voucher?.type ?? VoucherType.FIXED,
            usageCount: agg._count.id ?? 0,
            totalDiscountGiven: agg._sum.discountAmount ?? new Decimal(0),
            totalRevenueFromOrders: agg._sum.finalTotal ?? new Decimal(0),
        };
    });

    // Sort by usage count descending by default if multiple vouchers are returned
    if (!voucherCode) {
        data.sort((a, b) => b.usageCount - a.usageCount);
    }

    return {
        startDate,
        endDate,
        data,
    };
};