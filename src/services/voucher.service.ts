import { PrismaClient, Voucher, VoucherType, Prisma } from "@prisma/client"; // Import Prisma
import { Decimal } from "@prisma/client/runtime/library";
import { parsePaginationAndSorting } from "../utils/utils"; // Import helper

const prisma = new PrismaClient();

// Interface for create data, handling relation IDs
interface CreateVoucherData {
    code: string;
    type: VoucherType;
    discountPercent?: Decimal | number | null;
    discountAmount?: Decimal | number | null;
    maxDiscount?: Decimal | number | null;
    startDate: Date | string;
    endDate: Date | string;
    usageLimit?: number | null;
    minimumOrderValue?: Decimal | number | null;
    isActive?: boolean;
    applicableCategoryIds?: string[]; // Array of Category IDs
    excludedProductIds?: string[]; // Array of Product IDs
}

// Interface for update data
interface UpdateVoucherData {
    code?: string;
    type?: VoucherType;
    discountPercent?: Decimal | number | null;
    discountAmount?: Decimal | number | null;
    maxDiscount?: Decimal | number | null;
    startDate?: Date | string;
    endDate?: Date | string;
    usageLimit?: number | null;
    minimumOrderValue?: Decimal | number | null;
    isActive?: boolean;
    applicableCategoryIds?: string[];
    excludedProductIds?: string[];
}


// Function to get all vouchers with pagination
export const getAllVouchers = async (options: any = {}): Promise<{ data: Voucher[], total: number }> => {
    const { isActive, ...otherOptions } = options;

    // Use helper for pagination and sorting (defaulting to updatedAt desc)
    const { skip, take, orderBy } = parsePaginationAndSorting(options);

    const where: Prisma.VoucherWhereInput = {}; // Use Prisma type
    if (isActive !== undefined) {
        where.isActive = isActive === 'true' || isActive === true;
    }

    const findManyArgs: Prisma.VoucherFindManyArgs = {
        where,
        skip,
        take,
        include: {
            _count: { select: { orders: true } },
            applicableCategories: { select: { id: true, name: true } },
            excludedProducts: { select: { id: true, name: true } }
        },
        orderBy, // Use orderBy from helper
    };

     const [vouchers, totalVouchers] = await prisma.$transaction([
        prisma.voucher.findMany(findManyArgs),
        prisma.voucher.count({ where: findManyArgs.where })
    ]);

    return { data: vouchers, total: totalVouchers };
};

// Function to get a voucher by ID
export const getVoucherById = async (id: string): Promise<Voucher | null> => {
    return prisma.voucher.findUnique({
        where: { id },
        include: {
            applicableCategories: { select: { id: true, name: true } },
            excludedProducts: { select: { id: true, name: true } }
        }
    });
};

// Function to get a voucher by Code
export const getVoucherByCode = async (code: string): Promise<Voucher | null> => {
    return prisma.voucher.findUnique({
        where: { code },
         include: {
            applicableCategories: { select: { id: true, name: true } },
            excludedProducts: { select: { id: true, name: true } }
        }
    });
};


// Function to create a new voucher
export const createVoucher = async (data: CreateVoucherData): Promise<Voucher> => {
    const { applicableCategoryIds, excludedProductIds, ...voucherData } = data;

    // Basic validation (more in validation middleware)
    if (voucherData.type === VoucherType.PERCENT && !voucherData.discountPercent) {
        throw Object.assign(new Error("discountPercent is required for PERCENT type voucher."), { statusCode: 400 });
    }
    if (voucherData.type === VoucherType.FIXED && !voucherData.discountAmount) {
         throw Object.assign(new Error("discountAmount is required for FIXED type voucher."), { statusCode: 400 });
    }

    // Check for duplicate code
    const existingCode = await prisma.voucher.findUnique({ where: { code: voucherData.code } });
    if (existingCode) {
        throw Object.assign(new Error(`Voucher with code "${voucherData.code}" already exists.`), { statusCode: 409 });
    }

    return prisma.voucher.create({
        data: {
            ...voucherData,
            startDate: new Date(voucherData.startDate), // Ensure Date object
            endDate: new Date(voucherData.endDate),     // Ensure Date object
            // Connect relations using IDs provided
            applicableCategories: applicableCategoryIds ? {
                connect: applicableCategoryIds.map(id => ({ id }))
            } : undefined,
            excludedProducts: excludedProductIds ? {
                connect: excludedProductIds.map(id => ({ id }))
            } : undefined,
        },
         include: { // Include relations in response
            applicableCategories: { select: { id: true, name: true } },
            excludedProducts: { select: { id: true, name: true } }
        }
    });
};

// Function to update a voucher
export const updateVoucher = async (id: string, data: UpdateVoucherData): Promise<Voucher | null> => {
    const { applicableCategoryIds, excludedProductIds, ...voucherData } = data;

     // Check if voucher exists
     const existingVoucher = await prisma.voucher.findUnique({ where: { id } });
     if (!existingVoucher) {
         return null; // Not found
     }

    // Check for duplicate code if code is being changed
    if (voucherData.code && voucherData.code !== existingVoucher.code) {
        const existingCode = await prisma.voucher.findUnique({ where: { code: voucherData.code } });
        if (existingCode) {
            throw Object.assign(new Error(`Voucher with code "${voucherData.code}" already exists.`), { statusCode: 409 });
        }
    }

    // Prepare data, ensuring dates are Date objects if provided
    const updateData: any = { ...voucherData };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    // Handle relation updates using 'set' to replace existing connections
    if (applicableCategoryIds !== undefined) {
        updateData.applicableCategories = { set: applicableCategoryIds.map(id => ({ id })) };
    }
     if (excludedProductIds !== undefined) {
        updateData.excludedProducts = { set: excludedProductIds.map(id => ({ id })) };
    }


    try {
        const updatedVoucher = await prisma.voucher.update({
            where: { id },
            data: updateData,
             include: { // Include relations in response
                applicableCategories: { select: { id: true, name: true } },
                excludedProducts: { select: { id: true, name: true } }
            }
        });
        return updatedVoucher;
    } catch (error: any) {
        if (error.code === 'P2025') { // Record not found (should be caught by initial check)
            return null;
        }
        throw error; // Re-throw other errors
    }
};

// Function to delete a voucher
export const deleteVoucher = async (id: string): Promise<Voucher | null> => {
    // Note: Deleting a voucher might have implications if orders used it.
    // The current schema uses `onDelete: SetNull` for the Order relation,
    // so deleting a voucher will set `voucherId` to null on associated orders.
    try {
        const deletedVoucher = await prisma.voucher.delete({
            where: { id },
        });
        return deletedVoucher;
    } catch (error: any) {
        if (error.code === 'P2025') { // Record to delete not found
            return null;
        }
        throw error; // Re-throw other errors
    }
};
