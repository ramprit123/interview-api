
import { clerkMiddleware, requireAuth } from "@clerk/express";

// Initialize Clerk middleware
export const clerkAuth = clerkMiddleware();

// Require authentication middleware
export const requireClerkAuth = requireAuth();
