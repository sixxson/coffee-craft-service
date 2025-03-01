import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import * as bCrypt from "bcrypt";
import Joi from "joi";
import { User } from "../config/interface";

const prisma = new PrismaClient();
const TOKEN_EXPIRATION = "1h";

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("CUSTOMER", "ADMIN"),
});

export const register = async (req: Request, res: Response) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const { name, email, password, role = "CUSTOMER" } = req.body;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ message: "Email already exists" });
    return;
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
      },
    });
    const { password, ...userWithoutPass } = user;
    res.status(201).json(userWithoutPass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bCrypt.hash(password, saltRounds);
};

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const login = async (req: Request, res: Response) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // Compare password
  const passwordMatch = await bCrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // Generate token JWT
  const token = generateToken(user.id, user.role);
  res.json({ token });
};

const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign({ id: userId, role }, secret, {
    expiresIn: TOKEN_EXPIRATION,
  });
};

const checkRequestPermission = (
  requestingUser: User,
  userId: string
): boolean => {
  // Get the requesting user's information and role
  const isAdmin = requestingUser?.role === "ADMIN";

  // Check permissions
  if (!isAdmin && requestingUser?.id !== userId) {
    return false;
  }
  return true;
};

export const getUserById = async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (!userId) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  // Check permissions
  if (!checkRequestPermission(req.user as User, userId)) {
    res.status(403).json({ message: "Access forbidden" });
    return;
  }

  // Get user data
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
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
};

const updateUserSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6),
}).min(1);

export const updateUser = async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (!userId) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  const { error } = updateUserSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  // Check permissions
  if (!checkRequestPermission(req.user as User, userId)) {
    res.status(403).json({ message: "Access forbidden" });
    return;
  }

  // Get current user data
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  // Prepare update data
  const data: any = {};
  if (req.body.name) {
    data.name = req.body.name;
  }
  if (req.body.email) {
    // Check if email is different and already exists
    if (req.body.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: req.body.email },
      });
      if (existingUser) {
        res.status(409).json({ message: "Email already exists" });
        return;
      }
    }
    data.email = req.body.email;
  }
  if (req.body.password) {
    const hashedPassword = await hashPassword(req.body.password);
    data.password = hashedPassword;
  }

  // Update user
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });
    const { password, ...userWithoutPass } = updatedUser;
    res.json(userWithoutPass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (!userId) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }

  // Check permissions
  if (!checkRequestPermission(req.user as User, userId)) {
    res.status(403).json({ message: "Access forbidden" });
    return;
  }

  // Delete user
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    if ((error as any).code === "P2025") {
      // Prisma error code for record not found
      res.status(404).json({ message: "User not found" });
      return;
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
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
  res.json(users);
};
