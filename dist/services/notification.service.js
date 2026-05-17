"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.deleteReadNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = exports.createNotification = exports.pushToUser = exports.unregisterSSEClient = exports.registerSSEClient = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errors_1 = require("../utils/errors");
const sseClients = new Map();
const registerSSEClient = (userId, res) => {
    if (!sseClients.has(userId))
        sseClients.set(userId, new Set());
    sseClients.get(userId).add(res);
};
exports.registerSSEClient = registerSSEClient;
const unregisterSSEClient = (userId, res) => {
    sseClients.get(userId)?.delete(res);
};
exports.unregisterSSEClient = unregisterSSEClient;
const pushToUser = (userId, payload) => {
    const clients = sseClients.get(userId);
    if (!clients || clients.size === 0)
        return;
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients) {
        try {
            client.write(data);
        }
        catch { }
    }
};
exports.pushToUser = pushToUser;
const createNotification = async (userId, title, body, category = 'SYSTEM', metadata) => {
    const notification = await prisma_1.default.notification.create({
        data: {
            userId,
            title,
            body,
            category,
            metadata: metadata,
        },
    });
    (0, exports.pushToUser)(userId, { type: 'notification', notification });
    return notification;
};
exports.createNotification = createNotification;
const getNotifications = async (userId, params) => {
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '20');
    const skip = (page - 1) * limit;
    const where = {
        userId,
        ...(params.unreadOnly === 'true' ? { isRead: false } : {}),
    };
    const [notifications, total, unreadCount] = await Promise.all([
        prisma_1.default.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma_1.default.notification.count({ where }),
        prisma_1.default.notification.count({ where: { userId, isRead: false } }),
    ]);
    return {
        notifications,
        unreadCount,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};
exports.getNotifications = getNotifications;
const markAsRead = async (userId, notificationId) => {
    const notification = await prisma_1.default.notification.findFirst({
        where: { id: notificationId, userId },
    });
    if (!notification)
        throw new errors_1.AppError('Notification not found', 404);
    return prisma_1.default.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (userId) => {
    await prisma_1.default.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (userId, notificationId) => {
    const notification = await prisma_1.default.notification.findFirst({
        where: { id: notificationId, userId },
    });
    if (!notification)
        throw new errors_1.AppError('Notification not found', 404);
    await prisma_1.default.notification.delete({ where: { id: notificationId } });
};
exports.deleteNotification = deleteNotification;
const deleteReadNotifications = async (userId) => {
    await prisma_1.default.notification.deleteMany({ where: { userId, isRead: true } });
};
exports.deleteReadNotifications = deleteReadNotifications;
const getUnreadCount = async (userId) => {
    return prisma_1.default.notification.count({ where: { userId, isRead: false } });
};
exports.getUnreadCount = getUnreadCount;
//# sourceMappingURL=notification.service.js.map