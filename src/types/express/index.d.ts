// src/types/express/index.d.ts

// Import the necessary types from your project if needed, e.g., UserRole
// import { UserRole } from "@prisma/client";

// Define the structure of the user object attached by your middleware
interface UserPayload {
  id: string;
  role: string; // Or use UserRole if imported
  // Add other properties if your middleware attaches them (e.g., email)
}

declare global {
  namespace Express {
    export interface Request {
      user?: UserPayload; // Add the optional user property
    }
  }
}

// This empty export makes the file a module
export {};