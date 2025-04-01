import { PrismaClient, User, UserRole } from "@prisma/client"; // Corrected Role to UserRole
import { hashPassword } from "../utils/utils";
import * as bCrypt from "bcrypt";
// Removed HttpError import as it's not defined

const prisma = new PrismaClient({
  log: ["error"], // Consider adding 'query', 'info', 'warn' for more detailed logging during development
});

// Define an interface for the user data returned by the service (excluding password)
export interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole; // Corrected Role to UserRole
  createdAt: Date;
  updatedAt: Date;
}

// Define an interface for the update payload
interface UpdateUserData {
  name?: string;
  password?: string;
  oldPassword?: string; // Only used for validation, not stored
  // Add other updatable fields as needed
}

export const getAllUsersService = async (): Promise<SafeUser[]> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return users;
};

export const getUserByIdService = async (
  userId: string
): Promise<SafeUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
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
  if (requestingUserRole === "CUSTOMER" && userIdToUpdate !== requestingUserId) {
    // Throw standard error with statusCode
    throw Object.assign(new Error("Access forbidden, cannot update another user"), { statusCode: 403 });
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
    if (requestingUserRole === "CUSTOMER") { // Use requestingUserRole
      if (!data.oldPassword) {
        // Throw standard error with statusCode
        throw Object.assign(new Error("Old password is required"), { statusCode: 400 });
      }
      const passwordMatch = await bCrypt.compare(
        data.oldPassword,
        user.password
      );
      if (!passwordMatch) {
        // Throw standard error with statusCode
        throw Object.assign(new Error("Old password is incorrect"), { statusCode: 401 });
      }
    }
    // Hash the new password
    updateData.password = await hashPassword(data.password);
  }

  // Include other fields from data if they exist
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  // Add other fields here...

  // Prevent updating email or role directly through this service function
  // These should likely have dedicated functions or stricter checks if allowed

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate }, // Use userIdToUpdate
      data: updateData,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPass } = updatedUser;
    return userWithoutPass;
  } catch (error) {
    console.error("Error updating user:", error);
    // Throw standard error with statusCode
    throw Object.assign(new Error("Failed to update user"), { statusCode: 500 });
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
    throw Object.assign(new Error("Failed to delete user"), { statusCode: 500 });
  }
};
