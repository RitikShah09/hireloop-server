"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const token_1 = require("../utils/token");
const response_1 = require("../utils/response");
const authenticate = async (req, res, next) => {
    try {
        const cookieToken = req.cookies?.accessToken;
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;
        const token = cookieToken || bearerToken;
        if (!token) {
            (0, response_1.sendError)(res, 'Access token required', 401);
            return;
        }
        const payload = (0, token_1.verifyAccessToken)(token);
        const blacklisted = await (0, token_1.isAccessTokenBlacklisted)(payload.jti);
        if (blacklisted) {
            (0, response_1.sendError)(res, 'Token has been revoked', 401);
            return;
        }
        const sessionActive = await (0, token_1.isSessionActive)(payload.sessionId);
        if (!sessionActive) {
            (0, response_1.sendError)(res, 'Session expired or logged out', 401);
            return;
        }
        req.user = payload;
        next();
    }
    catch {
        (0, response_1.sendError)(res, 'Invalid or expired access token', 401);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            (0, response_1.sendError)(res, 'Insufficient permissions', 403);
            return;
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map