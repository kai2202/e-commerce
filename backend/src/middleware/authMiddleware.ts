import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      console.error(error);
    }
  }

  // Fallback to express-session
  const session = req.session as any;
  if (session && session.userId) {
    try {
      req.user = await User.findById(session.userId).select('-password');
      if (req.user) return next();
    } catch (error) {
      console.error(error);
    }
  }

  res.status(401).json({ message: 'Not authorized, no token or session' });
};

export const optionalProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error: any) {
      console.error('Optional protect error decoding JWT:', error.message);
    }
  } else {
    // Fallback to express-session
    const session = req.session as any;
    if (session && session.userId) {
      try {
        req.user = await User.findById(session.userId).select('-password');
      } catch (error: any) {
        console.error('Optional protect error loading session user:', error.message);
      }
    }
  }
  next();
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export const staffOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff_inventory')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as staff or admin' });
  }
};
