import { PrismaClient, OrderStatus } from '@prisma/client';
import { getDateRangeFromPeriod, Period } from '../../utils/period.util';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Define types
interface TopSellingProduct {
    productId: string;
    name: string;
    sku: string;
    totalQuantitySold: number;
    totalRevenue: Decimal;
}

interface TopSellingProductsResult {
    startDate: Date;
    endDate: Date;
    sortBy: 'quantity' | 'revenue';
    limit: number;
    data: TopSellingProduct[];
}

// Added types for Product Performance
interface PerformanceGroupData {
    id: string;
    name: string;
    totalQuantitySold: number;
    totalRevenue: Decimal;
}

interface ProductPerformanceResult {
    startDate: Date;
    endDate: Date;
    groupBy: 'category' | 'brand';
    data: PerformanceGroupData[];
}
// Added types for Product Inventory
// Updated types for Product Inventory (Refined Format)
interface InventoryProductInfo {
    productId: string;
    name: string;
    sku: string;
    stock: number;
}

interface InventorySummary {
    totalProducts: number;
    productsInStock: number;
    productsLowStock: number;
    productsOutOfStock: number;
    totalInventoryValue: Decimal;
}

interface ProductInventoryResult {
    lowStockThreshold: number;
    summary: InventorySummary;
    lowStockProducts: InventoryProductInfo[]; // Products with 0 < stock <= threshold
    outOfStockProducts: InventoryProductInfo[]; // Products with stock = 0
}
// Added types for Product Variant Performance
interface VariantPerformanceData {
    variantId: string;
    name: string; // Variant name
    sku: string | null;
    totalQuantitySold: number;
    totalRevenue: Decimal;
}

interface ProductVariantPerformanceResult {
    startDate: Date;
    endDate: Date;
    productId: string;
    productName: string; // Added product name for context
    data: VariantPerformanceData[];
}


/**
 * Get top selling products based on quantity or revenue for a given period.
 * @param sortBy - Sort by 'quantity' or 'revenue'
 * @param limit - Number of products to return
 * @param period - The time period - Optional, defaults to LAST_30_DAYS
 * @param customStartDate - Start date for custom period
 * @param customEndDate - End date for custom period
 * @param categoryId - Optional category filter
 * @param brandId - Optional brand filter
 * @returns List of top selling products
 */
export const getTopSellingProducts = async (
    sortBy: 'quantity' | 'revenue',
    limit: number,
    period?: Period, // Made period optional
    customStartDate?: string, // Expect string from validation
    customEndDate?: string,   // Expect string from validation
    categoryId?: string,
    brandId?: string
): Promise<TopSellingProductsResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);

    // Consider only completed/shipped orders for sales calculation
    const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    // Build the where clause for filtering orders
    const orderWhereClause: any = {
        createdAt: {
            gte: startDate,
            lte: endDate,
        },
        status: {
            in: relevantStatuses,
        },
    };

    // Build the where clause for filtering products (if categoryId or brandId is provided)
    const productWhereClause: any = {};
    if (categoryId) {
        productWhereClause.categoryId = categoryId;
    }
    if (brandId) {
        productWhereClause.brandId = brandId;
    }

    // Aggregate order items
    const aggregation = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
            order: orderWhereClause,
            // Apply product filters if they exist
            ...(Object.keys(productWhereClause).length > 0 && { product: productWhereClause }),
        },
        _sum: {
            quantity: true,
            subTotal: true, // Use subTotal from OrderItem which should reflect price at order time
        },
        orderBy: {
            _sum: {
                [sortBy === 'quantity' ? 'quantity' : 'subTotal']: 'desc',
            },
        },
        take: limit,
    });

    // Get product details for the top aggregated results
    const productIds = aggregation.map(item => item.productId);
    if (productIds.length === 0) {
        // No items found, return empty result early
        return { startDate, endDate, sortBy, limit, data: [] };
    }

    const products = await prisma.product.findMany({
        where: {
            id: {
                in: productIds,
            },
        },
        select: {
            id: true,
            name: true,
            sku: true,
            images: true,
        },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Combine aggregation results with product details
    const data: TopSellingProduct[] = aggregation.map(item => {
        const product = productMap.get(item.productId);
        return {
            productId: item.productId,
            name: product?.name ?? 'Unknown Product',
            sku: product?.sku ?? 'N/A',
            totalQuantitySold: item._sum.quantity ?? 0,
            totalRevenue: item._sum.subTotal ?? new Decimal(0),
            imageUrl: product?.images[0]?.url ?? null,
        };
    });

     // Re-sort based on the original aggregation order because findMany doesn't guarantee order
     const sortedData = data.sort((a, b) => {
        const indexA = aggregation.findIndex(item => item.productId === a.productId);
        const indexB = aggregation.findIndex(item => item.productId === b.productId);
        return indexA - indexB;
    });


    return {
        startDate,
        endDate,
        sortBy,
        limit,
        data: sortedData,
    };
};


/**
 * Get product performance grouped by category or brand for a given period.
 * @param groupBy - Group by 'category' or 'brand'
 * @param period - The time period - Optional, defaults to LAST_30_DAYS
 * @param customStartDate - Start date for custom period
 * @param customEndDate - End date for custom period
 * @returns List of performance data grouped by category or brand
 */
export const getProductPerformance = async (
    groupBy: 'category' | 'brand',
    period?: Period, // Made period optional
    customStartDate?: string, // Expect string from validation
    customEndDate?: string    // Expect string from validation
): Promise<ProductPerformanceResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);

    // Consider only completed/shipped orders for sales calculation
    const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    // Build the where clause for filtering orders
    const orderWhereClause: any = {
        createdAt: {
            gte: startDate,
            lte: endDate,
        },
        status: {
            in: relevantStatuses,
        },
    };

    // Determine the grouping field and relation based on groupBy parameter
    const relatedModel = groupBy === 'category' ? prisma.category : prisma.brand;
    const relatedFieldId = groupBy === 'category' ? 'categoryId' : 'brandId'; // Field in Product model

    // Aggregate order items first
    const orderItemsAggregation = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
            order: orderWhereClause,
            product: { // Ensure product exists and potentially filter null brandId if grouping by brand
                [relatedFieldId]: groupBy === 'brand' ? { not: null } : undefined,
            }
        },
        _sum: {
            quantity: true,
            subTotal: true,
        },
    });

    if (orderItemsAggregation.length === 0) {
        return { startDate, endDate, groupBy, data: [] };
    }

    // Fetch product details including the grouping field ID
    const productIds = orderItemsAggregation.map(item => item.productId);
    const productsWithGroupInfo = await prisma.product.findMany({
        where: { id: { in: productIds } },
        // Select only the necessary fields
        select: {
            id: true,
            categoryId: groupBy === 'category', // Conditionally select categoryId
            brandId: groupBy === 'brand',     // Conditionally select brandId
        }
    });

    // Create a map from productId to its categoryId/brandId
    // Explicitly type the map and the mapping function's return value
    const productGroupMap = new Map<string, string | null>(
        productsWithGroupInfo.map((p): [string, string | null] => {
            const groupId = groupBy === 'category' ? p.categoryId : p.brandId;
            return [p.id, groupId];
        })
    );


    // Aggregate the results further by the grouping field ID (category/brand)
    // Explicitly define the type for groupedResults keys as string
    const groupedResults: { [key: string]: { totalQuantitySold: number; totalRevenue: Decimal } } = {};

    for (const item of orderItemsAggregation) {
        const groupId = productGroupMap.get(item.productId);
        // Ensure groupId is a non-null string before using it as an index
        if (typeof groupId === 'string' && groupId) {
            if (!groupedResults[groupId]) {
                groupedResults[groupId] = { totalQuantitySold: 0, totalRevenue: new Decimal(0) };
            }
            groupedResults[groupId].totalQuantitySold += item._sum.quantity ?? 0;
            groupedResults[groupId].totalRevenue = groupedResults[groupId].totalRevenue.add(item._sum.subTotal ?? 0);
        }
    }

    // Fetch names for the categories/brands
    const groupIds = Object.keys(groupedResults);
    if (groupIds.length === 0) {
        return { startDate, endDate, groupBy, data: [] };
    }

    // Fetch details (id, name) for the relevant categories or brands
    const groupDetails = await (relatedModel as any).findMany({
        where: { id: { in: groupIds } },
        select: { id: true, name: true }
    });
    const groupNameMap = new Map<string, string>(
        groupDetails.map((g: { id: string, name: string }) => [g.id, g.name])
    );

    // Combine results with names
    const data: PerformanceGroupData[] = Object.entries(groupedResults).map(([id, totals]) => ({
        id: id,
        name: groupNameMap.get(id) ?? `Unknown/Deleted ${groupBy}`, // Provide default name
        totalQuantitySold: totals.totalQuantitySold,
        totalRevenue: totals.totalRevenue,
    })).sort((a, b) => b.totalRevenue.comparedTo(a.totalRevenue)); // Sort by revenue descending


    return {
        startDate,
        endDate,
        groupBy,
        data,
    };
};


/**
 * Get inventory statistics including low stock products and total inventory value.
 * @param lowStockThresholdInput - The threshold below which stock is considered low.
 * @returns Inventory statistics object
 */
export const getProductInventory = async (
    lowStockThresholdInput: number
): Promise<ProductInventoryResult> => {
    const lowStockThreshold = Number(lowStockThresholdInput);

    // Fetch all active products with necessary details
    const allActiveProducts = await prisma.product.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            price: true, // Needed for inventory value calculation
        },
        orderBy: {
            stock: 'asc', // Sorting helps slightly with processing later
        }
    });

    // Initialize counters and lists
    let totalInventoryValue = new Decimal(0);
    let productsInStock = 0;
    let productsLowStock = 0;
    let productsOutOfStock = 0;
    const lowStockProductsList: InventoryProductInfo[] = [];
    const outOfStockProductsList: InventoryProductInfo[] = [];

    // Process each active product
    for (const product of allActiveProducts) {
        const productInfo: InventoryProductInfo = {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            stock: product.stock,
        };

        if (product.stock > 0) {
            productsInStock++;
            // Calculate value only for products in stock
            totalInventoryValue = totalInventoryValue.add(product.price.mul(product.stock));

            if (product.stock <= lowStockThreshold) {
                productsLowStock++;
                lowStockProductsList.push(productInfo);
            }
        } else {
            productsOutOfStock++;
            outOfStockProductsList.push(productInfo);
        }
    }

    const totalProducts = allActiveProducts.length;

    // Construct the summary object
    const summary: InventorySummary = {
        totalProducts,
        productsInStock,
        productsLowStock,
        productsOutOfStock,
        totalInventoryValue,
    };

    return {
        lowStockThreshold,
        summary,
        lowStockProducts: lowStockProductsList,
        outOfStockProducts: outOfStockProductsList,
    };
};

/**
 * Get performance statistics for variants of a specific product.
 * @param productId - The ID of the product whose variants are being analyzed.
 * @param period - The time period. - Optional, defaults to LAST_30_DAYS
 * @param customStartDate - Start date for custom period.
 * @param customEndDate - End date for custom period.
 * @returns Performance data for each variant of the product.
 */
export const getProductVariantPerformance = async (
    productId: string,
    period?: Period, // Made period optional
    customStartDate?: string, // Expect string from validation
    customEndDate?: string    // Expect string from validation
): Promise<ProductVariantPerformanceResult> => {
    const { startDate, endDate } = getDateRangeFromPeriod(period, customStartDate, customEndDate);

    // Fetch the product name first for context
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true }
    });

    if (!product) {
        // Or throw an error if product must exist
        return { startDate, endDate, productId, productName: 'Product Not Found', data: [] };
    }

    // Consider only completed/shipped orders for sales calculation
    const relevantStatuses: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

    // Build the where clause for filtering orders
    const orderWhereClause: any = {
        createdAt: {
            gte: startDate,
            lte: endDate,
        },
        status: {
            in: relevantStatuses,
        },
    };

    // Aggregate order items specifically for the given product, grouping by variant
    const aggregation = await prisma.orderItem.groupBy({
        by: ['productVariantId'],
        where: {
            productId: productId, // Filter by the specific product
            productVariantId: { not: null }, // Only include items that have a variant ID
            order: orderWhereClause,
        },
        _sum: {
            quantity: true,
            subTotal: true,
        },
        orderBy: {
            _sum: {
                quantity: 'desc', // Default sort by quantity sold
            },
        },
    });

    // Get variant details for the aggregated results
    const variantIds = aggregation.map(item => item.productVariantId).filter((id): id is string => id !== null); // Filter out nulls and assert type

    if (variantIds.length === 0) {
        // No variant sales found for this product in the period
        return { startDate, endDate, productId, productName: product.name, data: [] };
    }

    const variants = await prisma.productVariant.findMany({
        where: {
            id: {
                in: variantIds,
            },
        },
        select: {
            id: true,
            name: true,
            sku: true,
        },
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    // Combine aggregation results with variant details
    const data: VariantPerformanceData[] = aggregation.map(item => {
        const variant = variantMap.get(item.productVariantId!); // Use non-null assertion as we filtered nulls
        return {
            variantId: item.productVariantId!,
            name: variant?.name ?? 'Unknown Variant',
            sku: variant?.sku ?? null,
            totalQuantitySold: item._sum.quantity ?? 0,
            totalRevenue: item._sum.subTotal ?? new Decimal(0),
        };
    });

     // Re-sort based on the original aggregation order (quantity desc)
     const sortedData = data.sort((a, b) => {
        const indexA = aggregation.findIndex(item => item.productVariantId === a.variantId);
        const indexB = aggregation.findIndex(item => item.productVariantId === b.variantId);
        return indexA - indexB;
    });

    return {
        startDate,
        endDate,
        productId,
        productName: product.name,
        data: sortedData,
    };
};


export default {
    getTopSellingProducts,
    getProductPerformance,
    getProductInventory,
    getProductVariantPerformance, // Added function to export
};