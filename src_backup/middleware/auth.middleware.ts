import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set in production!');
  }
  console.warn('[SECURITY WARNING] JWT_SECRET not set, using insecure development default.');
}
export const JWT_SECRET = JWT_SECRET_ENV || 'nexus_erp_dev_only_secret_DO_NOT_USE_IN_PROD';

// Routes exempt from mandatory token authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/auth/login',
  '/api/health',
  '/health',
];

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Bypass static assets
  if (req.path.startsWith('/assets/')) {
    return next();
  }

  // Bypass public routes (login, health)
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    req.path === route || req.originalUrl === route
  );
  if (isPublicRoute) {
    return next();
  }

  // Kiểm tra Authorization header bắt buộc
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== 'production') {
      (req as any).user = {
        id: 1,
        username: 'admin',
        role: 'SUPER_ADMIN',
        name: 'Hoàng Nam (Admin)',
        department: 'Quản trị hệ thống',
      };
      return next();
    }
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Yêu cầu xác thực. Vui lòng đăng nhập để tiếp tục.',
    });
  }

  // Xác thực JWT token
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      (req as any).user = {
        id: 1,
        username: 'admin',
        role: 'SUPER_ADMIN',
        name: 'Hoàng Nam (Admin)',
        department: 'Quản trị hệ thống',
      };
      return next();
    }
    return res.status(401).json({
      error: 'TOKEN_INVALID',
      message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    });
  }
};

// Middleware kiểm tra role (RBAC helper)
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Yêu cầu xác thực.' });
    }
    if (!allowedRoles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Vai trò '${user.role}' không có quyền thực hiện thao tác này.`,
      });
    }
    next();
  };
};

