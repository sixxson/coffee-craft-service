import { PrismaClient, UserRole, OrderStatus } from '@prisma/client'; // Added OrderStatus
import { getDateRangeFromPeriod, Period } from '../../utils/period.util';
import moment from 'moment-timezone'; // Import moment for date calculations
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// --- Define Types ---

interface UserSummaryResult {
    startDate?: Date; // Optional as it relates to newUsersInPeriod
    endDate?: Date;   // Optional as it relates to newUsersInPeriod
    totalUsers: number;
    newUsersInPeriod: number;
    activeUsers: number;
}

interface RoleDistribution {
    role: UserRole;
    count: number;
}

interface TopSpender {
    userId: string;
    name: string | null;
    email: string;
    totalSpent: Decimal;
    orderCount: number;
}

interface TopSpendersResult {
    startDate: Date;
    endDate: Date;
    limit: number;
    data: TopSpender[];
}

interface NewRegistrationDataPoint {
    date: string; // Format depends on groupBy (e.g., YYYY-MM-DD, YYYY-WW, YYYY-MM)
    count: number;
}

interface NewRegistrationsResult {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'week' | 'month';
    data: NewRegistrationDataPoint[];
}

// --- Service Functions ---

// Placeholder for User Summary
export const getUserSummary = async (
    period?: Period,
    customStartDate?: string,
    customEndDate?: string,
    activeThresholdDays: number = 30 // Default threshold
): Promise<UserSummaryResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);
    const activeSinceDate = moment().subtract(activeThresholdDays, 'days').toDate();

    // Perform queries concurrently
    const [totalUsersCount, newUsersCount, activeUsersCount] = await Promise.all([
        prisma.user.count({
            where: { isActive: true } // Optional: Count only active users if needed
        }),
        prisma.user.count({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                // isActive: true // Optional: Count only active new users
            },
        }),
        prisma.user.count({
            where: {
                lastLogin: {
                    gte: activeSinceDate,
                },
                isActive: true // Usually only count active users as 'active'
            },
        }),
    ]);

    return {
        // Only return startDate/endDate if a specific period was requested for newUsers
        startDate: (period || (customStartDate && customEndDate)) ? startDate : undefined,
        endDate: (period || (customStartDate && customEndDate)) ? endDate : undefined,
        totalUsers: totalUsersCount,
        newUsersInPeriod: newUsersCount,
        activeUsers: activeUsersCount,
    };
};

// Function for Role Distribution
export const getRoleDistribution = async (): Promise<RoleDistribution[]> => {
    const results = await prisma.user.groupBy({
        by: ['role'],
        _count: {
            id: true, // Count by user ID
        },
        where: {
            isActive: true // Optional: Only count active users per role
        }
    });

    // Map results and ensure all roles are present
    const allRoles = Object.values(UserRole);
    const roleMap = new Map<UserRole, number>();

    results.forEach(result => {
        roleMap.set(result.role, result._count.id || 0);
    });

    const finalData = allRoles.map(role => ({
        role: role,
        count: roleMap.get(role) || 0,
    }));

    return finalData;
};

// Function for Top Spenders
export const getTopSpenders = async (
    limit: number,
    sortBy: 'totalSpent' | 'orderCount' = 'totalSpent', // Add sortBy parameter with default
    period?: Period,
    customStartDate?: string,
    customEndDate?: string
): Promise<TopSpendersResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);

    // Define relevant order statuses for spending calculation
    const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    // Aggregate orders to find top spenders by userId
    const spendingAggregation = await prisma.order.groupBy({
        by: ['userId'],
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            status: {
                in: relevantStatuses,
            },
            // Optional: Exclude STAFF/ADMIN if needed
            // user: {
            //     role: UserRole.CUSTOMER
            // }
        },
        _sum: {
            finalTotal: true,
        },
        _count: {
            id: true, // Count number of orders
        },
        orderBy: {
            // Sort based on the sortBy parameter
            ...(sortBy === 'totalSpent' && {
                _sum: {
                    finalTotal: 'desc',
                },
            }),
            ...(sortBy === 'orderCount' && {
                _count: {
                    id: 'desc',
                },
            }),
        },
        take: limit,
    });

    if (spendingAggregation.length === 0) {
        return { startDate, endDate, limit, data: [] };
    }

    // Fetch user details for the top spenders
    const userIds = spendingAggregation.map(agg => agg.userId);
    const users = await prisma.user.findMany({
        where: {
            id: { in: userIds },
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Combine aggregation results with user details
    const data: TopSpender[] = spendingAggregation.map(agg => {
        const user = userMap.get(agg.userId);
        return {
            userId: agg.userId,
            name: user?.name ?? null,
            email: user?.email ?? 'Unknown Email',
            totalSpent: agg._sum.finalTotal ?? new Decimal(0),
            orderCount: agg._count.id ?? 0,
        };
    });

    // The data is already sorted by the Prisma query, no need to re-sort here.

    return {
        startDate,
        endDate,
        limit,
        data: data, // Use the directly mapped data
    };
};


// Function for New Registrations Trend
export const getNewRegistrations = async (
    groupBy: 'day' | 'week' | 'month',
    period?: Period,
    customStartDate?: string,
    customEndDate?: string
): Promise<NewRegistrationsResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);

    // Prisma's groupBy doesn't directly support grouping by date parts like week/month easily across DBs.
    // Raw SQL is often more reliable for this.
    // We'll use a simplified approach here, fetching all relevant users and grouping in code.
    // For large datasets, a raw SQL query would be significantly more performant.

    const users = await prisma.user.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        select: {
            createdAt: true,
        },
        orderBy: {
            createdAt: 'asc', // Sorting helps slightly
        }
    });

    const groupedCounts: { [key: string]: number } = {};

    users.forEach(user => {
        let key: string;
        const createdAtMoment = moment(user.createdAt); // Use moment for formatting

        switch (groupBy) {
            case 'week':
                // Format as YYYY-WW (e.g., 2023-42)
                key = createdAtMoment.format('YYYY-WW');
                break;
            case 'month':
                // Format as YYYY-MM (e.g., 2023-10)
                key = createdAtMoment.format('YYYY-MM');
                break;
            case 'day':
            default:
                // Format as YYYY-MM-DD
                key = createdAtMoment.format('YYYY-MM-DD');
                break;
        }

        groupedCounts[key] = (groupedCounts[key] || 0) + 1;
    });

    const data: NewRegistrationDataPoint[] = Object.entries(groupedCounts).map(([dateKey, count]) => ({
        date: dateKey,
        count: count,
    }));

    // Ensure chronological order if needed (Object.entries doesn't guarantee order)
    data.sort((a, b) => a.date.localeCompare(b.date));


    return {
        startDate,
        endDate,
        groupBy,
        data,
    };
};