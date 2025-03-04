import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import * as jwt from "jsonwebtoken";
import * as bCrypt from "bcrypt";
import { hashPassword } from "../utils/utils";

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
    console.log(error);
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

export const logout = async (req: Request, res: Response) => {
  res
    .clearCookie("access_token")
    .status(200)
    .json({ message: "Logout successful" });
};
