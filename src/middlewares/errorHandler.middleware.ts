import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(err); // Log the error for debugging purposes

    let statusCode = 500; // Default to 500
    let message = 'Internal Server Error';
    let stack = undefined;

    if (err instanceof Error) {
        message = err.message;
        if (process.env.NODE_ENV !== 'production') {
            stack = err.stack;
        }
        // Check if statusCode exists and is a number
        if (typeof (err as any).statusCode === 'number') {
          statusCode = (err as any).statusCode;
        }

    } else if (typeof err === 'string') {
      message = err;
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(stack && { stack })
    });
    console.log("Error handler completed");
};

export default errorHandler;
