import { Request, Response } from 'express';
export declare const streamNotifications: (
  req: Request,
  res: Response,
  next: import('express').NextFunction
) => void;
export declare const getNotifications: (
  req: Request,
  res: Response,
  next: import('express').NextFunction
) => void;
export declare const getUnreadCount: (
  req: Request,
  res: Response,
  next: import('express').NextFunction
) => void;
export declare const markAsRead: (
  req: Request,
  res: Response,
  next: import('express').NextFunction
) => void;
export declare const markAllAsRead: (
  req: Request,
  res: Response,
  next: import('express').NextFunction
) => void;
export declare const deleteNotification: (
  req: Request,
  res: Response,
  next: import('express').NextFunction
) => void;
export declare const deleteReadNotifications: (
  req: Request,
  res: Response,
  next: import('express').NextFunction
) => void;
//# sourceMappingURL=notification.controller.d.ts.map
