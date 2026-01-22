import { PrismaClient, User, UserRole, GENDER, Prisma } from "@prisma/client"; // Added GENDER enum import and Prisma
import { hashPassword, parsePaginationAndSorting } from "../utils/utils"; // Import helpers
import * as bCrypt from "bcrypt";

const prisma = new PrismaClient({
  log: ["error"], // Consider adding 'query', 'info', 'warn' for more detailed logging during development
});

// Define an interface for the user data returned by the service (excluding password)
export interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null; // Added
  address: string | null; // Added
  imgUrl: string | null; // Added
  gender: GENDER | null; // Added
  dob: Date | null; // Added
  role: UserRole;
  emailVerified: boolean; // Added
  lastLogin: Date | null; // Added
  isActive: boolean; // Added
  createdAt: Date;
  updatedAt: Date;
  // Consider adding counts or basic relations if needed for summaries
}

// Define an interface for the update payload
interface UpdateUserData {
  name?: string;
  password?: string;
  oldPassword?: string; // Only used for validation, not stored
  phone?: string | null; // Added
  address?: string | null; // Added
  imgUrl?: string | null; // Added
  gender?: GENDER | null; // Added
  dob?: Date | string | null; // Added (allow string for input, convert later)
  isActive?: boolean; // Added (Likely admin only)
  role?: UserRole; // Added (Likely admin only)
}

export const getAllUsersService = async (
  options: any = {}
): Promise<{ data: SafeUser[]; total: number }> => {
  // Update return type
  // Use helper for pagination and sorting (defaulting to updatedAt desc)
  const { skip, take, orderBy } = parsePaginationAndSorting(options);

  const findManyArgs: Prisma.UserFindManyArgs = {
    // skip,
    // take,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      imgUrl: true,
      gender: true,
      dob: true,
      role: true,
      emailVerified: true,
      lastLogin: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy,
  };

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany(findManyArgs),
    prisma.user.count({ where: findManyArgs.where }), // Add count query
  ]);

  return { data: users, total: totalCount }; // Return object with data and total
};

export const getUserByIdService = async (
  userId: string
): Promise<SafeUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // Select specific fields instead of including everything by default
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      imgUrl: true,
      gender: true,
      dob: true,
      role: true,
      emailVerified: true,
      lastLogin: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      // Include related data selectively if needed for this specific view
      orders: {
        select: { id: true, finalTotal: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      shippingAddresses: {
        select: { id: true, address: true, receiverName: true },
      },
      reviews: {
        select: {
          id: true,
          product: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  // Prisma returns null if not found, no need for explicit check before return
  return user;
};

export const updateUserService = async (
  userIdToUpdate: string, // Renamed for clarity
  data: UpdateUserData,
  // Accept ID and Role instead of the full User object
  requestingUserId: string | undefined,
  requestingUserRole: UserRole | undefined
): Promise<SafeUser> => {
  // Permission Check: Customer can only update their own profile
  if (
    requestingUserRole === "CUSTOMER" &&
    userIdToUpdate !== requestingUserId
  ) {
    // Throw standard error with statusCode
    throw Object.assign(
      new Error("Access forbidden, cannot update another user"),
      { statusCode: 403 }
    );
  }

  // Find the user being updated
  const user = await prisma.user.findUnique({ where: { id: userIdToUpdate } }); // Corrected userId to userIdToUpdate
  if (!user) {
    // Throw standard error with statusCode
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }

  const updateData: Partial<User> = {};

  // Handle password update logic
  if (data.password) {
    // If the user is a customer, validate old password
    // Use requestingUserRole
    if (!data.oldPassword) {
      // Throw standard error with statusCode
      throw Object.assign(new Error("Old password is required"), {
        statusCode: 400,
      });
    }
    const passwordMatch = await bCrypt.compare(data.oldPassword, user.password);
    if (!passwordMatch) {
      // Throw standard error with statusCode
      throw Object.assign(new Error("Old password is incorrect"), {
        statusCode: 403,
      });
    }
    // Hash the new password
    updateData.password = await hashPassword(data.password);
  }

  // Include other fields from data if they exist
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  // Add other updatable fields
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.imgUrl !== undefined) updateData.imgUrl = data.imgUrl;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.dob !== undefined) {
    // Ensure dob is a Date object or null
    updateData.dob = data.dob ? new Date(data.dob) : null;
  }

  // Admin/Staff specific updates (ensure role check allows this)
  if (
    requestingUserRole === UserRole.ADMIN ||
    requestingUserRole === UserRole.STAFF
  ) {
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role !== undefined) {
      // Add validation if necessary (e.g., prevent demoting self)
      updateData.role = data.role;
    }
    // Admin might be able to reset password without oldPassword - add logic if needed
  }

  // Prevent updating email directly through this generic update function
  // Email changes usually require verification and should have a dedicated process

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: updateData,
      // Select the fields matching SafeUser to return
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        imgUrl: true,
        gender: true,
        dob: true,
        role: true,
        emailVerified: true,
        lastLogin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    // No need to manually remove password as `select` excludes it
    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    // Throw standard error with statusCode
    throw Object.assign(new Error("Failed to update user"), {
      statusCode: 500,
    });
  }
};

export const deleteUserService = async (userId: string): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    if ((error as any).code === "P2025") {
      // Prisma error code for record not found
      // Throw standard error with statusCode
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    console.error("Error deleting user:", error);
    // Throw standard error with statusCode
    throw Object.assign(new Error("Failed to delete user"), {
      statusCode: 500,
    });
  }
};
