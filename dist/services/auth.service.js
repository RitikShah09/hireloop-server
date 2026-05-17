"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getUserProfile = exports.revokeSession = exports.getUserSessions = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../config/prisma"));
const errors_1 = require("../utils/errors");
const token_1 = require("../utils/token");
const registerUser = async (input, meta) => {
    const existing = await prisma_1.default.user.findUnique({
        where: { email: input.email },
    });
    if (existing)
        throw new errors_1.AppError('Email already in use', 409);
    const hashedPassword = await bcryptjs_1.default.hash(input.password, 12);
    const user = await prisma_1.default.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                email: input.email,
                password: hashedPassword,
                role: input.role,
                isVerified: true,
            },
        });
        if (input.role === 'CANDIDATE') {
            await tx.candidate.create({
                data: {
                    userId: newUser.id,
                    firstName: input.firstName || '',
                    lastName: input.lastName || '',
                },
            });
        }
        else if (input.role === 'COMPANY') {
            await tx.company.create({
                data: { userId: newUser.id, name: input.companyName || '' },
            });
        }
        return newUser;
    });
    const sessionId = (0, uuid_1.v4)();
    const { accessToken, refreshToken } = (0, token_1.generateTokens)({
        userId: user.id,
        role: user.role,
        sessionId,
    });
    await (0, token_1.storeSession)(sessionId, user.id, meta);
    await prisma_1.default.$transaction([
        prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                sessionId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        }),
        prisma_1.default.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                userAgent: meta.userAgent,
                ipAddress: meta.ipAddress,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        }),
    ]);
    return {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
    };
};
exports.registerUser = registerUser;
const loginUser = async (input, meta) => {
    const user = await prisma_1.default.user.findUnique({ where: { email: input.email } });
    if (!user)
        throw new errors_1.AppError('Invalid credentials', 401);
    if (user.isBlocked)
        throw new errors_1.AppError('Account has been blocked', 403);
    const isValid = await bcryptjs_1.default.compare(input.password, user.password);
    if (!isValid)
        throw new errors_1.AppError('Invalid credentials', 401);
    const sessionId = (0, uuid_1.v4)();
    const { accessToken, refreshToken } = (0, token_1.generateTokens)({
        userId: user.id,
        role: user.role,
        sessionId,
    });
    await (0, token_1.storeSession)(sessionId, user.id, meta);
    await prisma_1.default.$transaction([
        prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                sessionId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        }),
        prisma_1.default.session.create({
            data: {
                id: sessionId,
                userId: user.id,
                userAgent: meta.userAgent,
                ipAddress: meta.ipAddress,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        }),
    ]);
    return {
        user: { id: user.id, email: user.email, role: user.role },
        accessToken,
        refreshToken,
    };
};
exports.loginUser = loginUser;
const refreshAccessToken = async (refreshToken) => {
    const blacklisted = await (0, token_1.isRefreshTokenBlacklisted)(refreshToken);
    if (blacklisted)
        throw new errors_1.AppError('Refresh token revoked', 401);
    let payload;
    try {
        payload = (0, token_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw new errors_1.AppError('Invalid or expired refresh token', 401);
    }
    const active = await (0, token_1.isSessionActive)(payload.sessionId);
    if (!active)
        throw new errors_1.AppError('Session expired', 401);
    const stored = await prisma_1.default.refreshToken.findUnique({
        where: { token: refreshToken },
    });
    if (!stored)
        throw new errors_1.AppError('Refresh token not found', 401);
    await (0, token_1.blacklistRefreshToken)(refreshToken);
    await prisma_1.default.refreshToken.delete({ where: { token: refreshToken } });
    const { accessToken, refreshToken: newRefreshToken } = (0, token_1.generateTokens)({
        userId: payload.userId,
        role: payload.role,
        sessionId: payload.sessionId,
    });
    await prisma_1.default.refreshToken.create({
        data: {
            token: newRefreshToken,
            userId: payload.userId,
            sessionId: payload.sessionId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    const user = await prisma_1.default.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true },
    });
    return { accessToken, refreshToken: newRefreshToken, user };
};
exports.refreshAccessToken = refreshAccessToken;
const logoutUser = async (userId, sessionId, jti, refreshToken, logoutAll = false) => {
    await (0, token_1.blacklistAccessToken)(jti);
    if (logoutAll) {
        await (0, token_1.invalidateAllSessions)(userId);
        await prisma_1.default.session.updateMany({
            where: { userId },
            data: { isActive: false },
        });
        await prisma_1.default.refreshToken.deleteMany({ where: { userId } });
    }
    else {
        await (0, token_1.invalidateSession)(sessionId, userId);
        await prisma_1.default.session.update({
            where: { id: sessionId },
            data: { isActive: false },
        });
        if (refreshToken) {
            await (0, token_1.blacklistRefreshToken)(refreshToken);
            await prisma_1.default.refreshToken.deleteMany({ where: { token: refreshToken } });
        }
    }
};
exports.logoutUser = logoutUser;
const getUserSessions = async (userId) => {
    return prisma_1.default.session.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            createdAt: true,
            expiresAt: true,
        },
    });
};
exports.getUserSessions = getUserSessions;
const revokeSession = async (userId, sessionId) => {
    const session = await prisma_1.default.session.findFirst({
        where: { id: sessionId, userId },
    });
    if (!session)
        throw new errors_1.AppError('Session not found', 404);
    await (0, token_1.invalidateSession)(sessionId, userId);
    await prisma_1.default.$transaction([
        prisma_1.default.session.update({
            where: { id: sessionId },
            data: { isActive: false },
        }),
        prisma_1.default.refreshToken.deleteMany({ where: { sessionId } }),
    ]);
};
exports.revokeSession = revokeSession;
const getUserProfile = async (userId) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            isVerified: true,
            createdAt: true,
            candidate: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
            company: { select: { id: true, name: true, logoUrl: true } },
        },
    });
    if (!user)
        throw new errors_1.AppError('User not found', 404);
    return user;
};
exports.getUserProfile = getUserProfile;
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new errors_1.AppError('User not found', 404);
    const isValid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isValid)
        throw new errors_1.AppError('Current password is incorrect', 400);
    if (currentPassword === newPassword) {
        throw new errors_1.AppError('New password must differ from current password', 400);
    }
    const hashed = await bcryptjs_1.default.hash(newPassword, 12);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { password: hashed },
    });
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.service.js.map