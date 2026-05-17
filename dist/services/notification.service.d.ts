import { NotificationCategory, Prisma } from '@prisma/client';
import { Response } from 'express';
export declare const registerSSEClient: (userId: string, res: Response) => void;
export declare const unregisterSSEClient: (
  userId: string,
  res: Response
) => void;
export declare const pushToUser: (
  userId: string,
  payload: Record<string, unknown>
) => void;
export declare const createNotification: (
  userId: string,
  title: string,
  body: string,
  category?: NotificationCategory,
  metadata?: Record<string, unknown>
) => Promise<{
  userId: string;
  id: string;
  createdAt: Date;
  title: string;
  body: string;
  category: import('@prisma/client').$Enums.NotificationCategory;
  isRead: boolean;
  metadata: Prisma.JsonValue | null;
}>;
export declare const getNotifications: (
  userId: string,
  params: {
    page?: string;
    limit?: string;
    unreadOnly?: string;
  }
) => Promise<{
  notifications: {
    userId: string;
    id: string;
    createdAt: Date;
    title: string;
    body: string;
    category: import('@prisma/client').$Enums.NotificationCategory;
    isRead: boolean;
    metadata: Prisma.JsonValue | null;
  }[];
  unreadCount: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;
export declare const markAsRead: (
  userId: string,
  notificationId: string
) => Promise<{
  userId: string;
  id: string;
  createdAt: Date;
  title: string;
  body: string;
  category: import('@prisma/client').$Enums.NotificationCategory;
  isRead: boolean;
  metadata: Prisma.JsonValue | null;
}>;
export declare const markAllAsRead: (userId: string) => Promise<void>;
export declare const deleteNotification: (
  userId: string,
  notificationId: string
) => Promise<void>;
export declare const deleteReadNotifications: (userId: string) => Promise<void>;
export declare const getUnreadCount: (userId: string) => Promise<number>;
//# sourceMappingURL=notification.service.d.ts.map
