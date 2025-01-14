import { Request, Response, NextFunction } from "express";

export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${err.message}`);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
};
