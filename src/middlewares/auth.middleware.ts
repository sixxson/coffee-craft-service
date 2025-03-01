import { Request, Response, NextFunction } from "express";

// Extend the Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { User } from "../config/interface";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No valid token provided" });
    return;
  }

  const token = authHeader.split(" ")[1].trim();
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as User;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ message: "Expired token" });
      return;
    }
    if (error instanceof JsonWebTokenError) {
      res.status(401).json({ message: "Token not valid" });
      return;
    }
    res.status(500).json({ message: "Unexpected error" });
  }
};

export default authenticate;
