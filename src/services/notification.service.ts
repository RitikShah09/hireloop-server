import prisma from '../config/prisma';
import { AppError } from '../utils/errors';
import { NotificationCategory, Prisma } from '@prisma/client';
import { Response } from 'express';

const sseClients = new Map<string, Set<Response>>();

export const registerSSEClient = (userId: string, res: Response) => {
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId)!.add(res);
};

export const unregisterSSEClient = (userId: string, res: Response) => {
  sseClients.get(userId)?.delete(res);
};

export const pushToUser = (
  userId: string,
  payload: Record<string, unknown>
) => {
  const clients = sseClients.get(userId);
  if (!clients || clients.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(data);
    } catch {}
  }
};

export const createNotification = async (
  userId: string,
  title: string,
  body: string,
  category: NotificationCategory = 'SYSTEM',
  metadata?: Record<string, unknown>
) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      body,
      category,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  pushToUser(userId, { type: 'notification', notification });
  return notification;
};

export const getNotifications = async (
  userId: string,
  params: { page?: string; limit?: string; unreadOnly?: string }
) => {
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(params.unreadOnly === 'true' ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new AppError('Notification not found', 404);

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const deleteNotification = async (
  userId: string,
  notificationId: string
) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new AppError('Notification not found', 404);
  await prisma.notification.delete({ where: { id: notificationId } });
};

export const deleteReadNotifications = async (userId: string) => {
  await prisma.notification.deleteMany({ where: { userId, isRead: true } });
};

export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({ where: { userId, isRead: false } });
};
