'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.deleteReadNotifications =
  exports.deleteNotification =
  exports.markAllAsRead =
  exports.markAsRead =
  exports.getUnreadCount =
  exports.getNotifications =
  exports.streamNotifications =
    void 0;
const errors_1 = require('../utils/errors');
const response_1 = require('../utils/response');
const notificationService = __importStar(
  require('../services/notification.service')
);
exports.streamNotifications = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
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
});
exports.getNotifications = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const result = await notificationService.getNotifications(
    user.userId,
    req.query
  );
  res.json({ success: true, message: 'Notifications fetched', ...result });
});
exports.getUnreadCount = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const count = await notificationService.getUnreadCount(user.userId);
  (0, response_1.sendSuccess)(res, 'Unread count', { count });
});
exports.markAsRead = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const notification = await notificationService.markAsRead(
    user.userId,
    req.params.id
  );
  (0, response_1.sendSuccess)(res, 'Marked as read', notification);
});
exports.markAllAsRead = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  await notificationService.markAllAsRead(user.userId);
  (0, response_1.sendSuccess)(res, 'All notifications marked as read');
});
exports.deleteNotification = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  await notificationService.deleteNotification(user.userId, req.params.id);
  (0, response_1.sendSuccess)(res, 'Notification deleted');
});
exports.deleteReadNotifications = (0, errors_1.asyncHandler)(
  async (req, res) => {
    const user = req.user;
    await notificationService.deleteReadNotifications(user.userId);
    (0, response_1.sendSuccess)(res, 'Read notifications deleted');
  }
);
//# sourceMappingURL=notification.controller.js.map
