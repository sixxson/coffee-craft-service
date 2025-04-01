import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { UserRole } from "@prisma/client";

// Controller to get all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await userService.getAllUsersService();
    res.json(users);
  } catch (error) {
    next(error); // Pass error to the central error handler
  }
};

// Controller to get a user by ID
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.params.id;
  // Removed redundant userId check

  try {
    const user = await userService.getUserByIdService(userId);
    if (!user) {
      // Use standard error with statusCode for the error handler
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    res.json(user);
  } catch (error) {
    next(error); // Pass error to the central error handler
  }
};

// Controller to update a user
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userIdToUpdate = req.params.id;
  const updateData = req.body; // Assumes validation middleware has run
  const requestingUserId = req.user?.id; // Get ID from authenticated user (JWT)
  // Cast the string role from JWT to the UserRole enum type
  const requestingUserRole = req.user?.role as UserRole | undefined;

  // Removed redundant userId check and user reconstruction logic

  try {
    // Pass the necessary arguments to the updated service function
    const updatedUser = await userService.updateUserService(
      userIdToUpdate,
      updateData,
      requestingUserId,
      requestingUserRole
    );
    res.json(updatedUser);
  } catch (error) {
    next(error); // Pass error to the central error handler
  }
};

// Controller to delete a user
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.params.id;
  // Removed redundant userId check

  try {
    await userService.deleteUserService(userId);
    res.status(200).json({ message: "User deleted successfully" }); // Send 200 OK on successful deletion
  } catch (error) {
    next(error); // Pass error to the central error handler
  }
};
