import * as bCrypt from "bcrypt";
import { Prisma } from "@prisma/client"; // Import Prisma types

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bCrypt.hash(password, saltRounds);
};

// Helper function to process ID filters (single string, array, or comma-separated string)
// Returns a Prisma filter object ({ in: [...] } or { equals: ... }) or undefined
export const processIdFilterInput = (input: string | string[] | undefined): Prisma.StringFilter | Prisma.StringNullableFilter | undefined => {
    if (!input) {
        return undefined;
    }
    if (Array.isArray(input)) {
        // Filter out any non-string values just in case
        const validIds = input.filter(id => typeof id === 'string');
        // Return undefined if the resulting array is empty
        return validIds.length > 0 ? { in: validIds } : undefined;
    } else if (typeof input === 'string') {
        // Handle comma-separated strings
        const ids = input.split(',').map(id => id.trim()).filter(Boolean);
        if (ids.length > 1) {
            return { in: ids }; // Use 'in' for multiple IDs
        } else if (ids.length === 1) {
            // For a single ID, use the 'equals' filter for clarity and potential index usage
            return { equals: ids[0] };
        }
    }
    // Return undefined if the input was invalid or resulted in no valid IDs
    return undefined;
};

// Helper function to parse common pagination and sorting query parameters
export const parsePaginationAndSorting = (options: any, defaultSortBy: string = 'updatedAt', defaultSortOrder: 'asc' | 'desc' = 'desc') => { // Changed default sortBy
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10; // Default limit to 10
    const sortBy = typeof options.sortBy === 'string' ? options.sortBy : defaultSortBy;
    const sortOrder = options.sortOrder === 'asc' || options.sortOrder === 'desc' ? options.sortOrder : defaultSortOrder;

    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = { [sortBy]: sortOrder };

    return { skip, take, orderBy };
};
