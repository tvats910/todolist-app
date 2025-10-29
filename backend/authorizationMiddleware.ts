// backend/authorizationMiddleware.ts
import { Request, Response, NextFunction } from 'express';

// This is a "higher-order function" that takes the allowed roles
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      // If the user's role is not in the allowed list, deny access
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource.' });
    }
    
    // If the role is allowed, proceed to the route
    next();
  };
};