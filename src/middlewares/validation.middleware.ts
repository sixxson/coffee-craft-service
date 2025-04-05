import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// --- Add custom type definition ---
// Extend Express Request type to include validatedQuery
declare global {
    namespace Express {
      interface Request {
        validatedQuery?: any; // Use 'any' for simplicity or define a more specific type if needed later
      }
    }
  }
// ---------------------------------

// Middleware factory function that takes a Joi schema for request body
export const validateRequestBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys from the validated object
    });

    if (error) {
      // Map Joi error details to a more user-friendly format if desired
      const errors = error.details.map((detail) => ({
        message: detail.message,
         path: detail.path,
       }));
       res.status(400).json({ message: 'Validation failed', errors });
       return; // Exit after sending error response
     }

     // Attach the validated and potentially stripped value to the request object
    // This ensures controllers use the validated data
    req.body = value;
    next();
  };
};

// Optional: Middleware for validating request parameters (e.g., /:id)
export const validateRequestParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Validate req.params
        const { error, value } = schema.validate(req.params, { abortEarly: false }); // Added value and abortEarly
        if (error) {
            const errors = error.details.map((detail) => ({
                message: detail.message,
                 path: detail.path,
             }));
             res.status(400).json({ message: 'Invalid request parameters', errors });
             return; // Exit after sending error response
         }
         // Assign validated params back (optional, but good practice)
         req.params = value;
         next();
    };
};

// Optional: Middleware for validating query parameters (e.g., ?limit=10)
export const validateRequestQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Validate req.query
        // Use convert: true to allow Joi to coerce types (e.g., string '10' to number 10)
        const { error, value } = schema.validate(req.query, { abortEarly: false, convert: true });
        if (error) {
             const errors = error.details.map((detail) => ({
                message: detail.message,
                 path: detail.path,
             }));
             res.status(400).json({ message: 'Invalid query parameters', errors });
             return; // Exit after sending error response
         }
         // *** Assign validated query params to req.validatedQuery ***
         req.validatedQuery = value;
         next();
    };
};
