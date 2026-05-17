import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import * as notificationService from '../services/notification.service';
import { AuthenticatedRequest } from '../types';

export const streamNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(
      `data: ${JSON.stringify({ type: 'connected', userId: user.userId })}\n\n`
    );

    notificationService.registerSSEClient(user.userId, res);

    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      notificationService.unregisterSSEClient(user.userId, res);
    });
  }
);

export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await notificationService.getNotifications(
      user.userId,
      req.query as Record<string, string>
    );
    res.json({ success: true, message: 'Notifications fetched', ...result });
  }
);

export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    const count = await notificationService.getUnreadCount(user.userId);
    sendSuccess(res, 'Unread count', { count });
  }
);

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const notification = await notificationService.markAsRead(
    user.userId,
    req.params.id as string
  );
  sendSuccess(res, 'Marked as read', notification);
});

export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await notificationService.markAllAsRead(user.userId);
    sendSuccess(res, 'All notifications marked as read');
  }
);

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await notificationService.deleteNotification(
      user.userId,
      req.params.id as string
    );
    sendSuccess(res, 'Notification deleted');
  }
);

export const deleteReadNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    await notificationService.deleteReadNotifications(user.userId);
    sendSuccess(res, 'Read notifications deleted');
  }
);
