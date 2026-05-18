import { JwtPayload } from '../types';
import { Role } from '@prisma/client';
export declare const generateTokens: (payload: {
    userId: string;
    role: Role;
    sessionId: string;
}) => {
    accessToken: string;
    refreshToken: string;
    jti: string;
};
export declare const verifyAccessToken: (token: string) => JwtPayload;
export declare const verifyRefreshToken: (token: string) => JwtPayload;
export declare const blacklistAccessToken: (jti: string) => Promise<void>;
export declare const blacklistRefreshToken: (token: string) => Promise<void>;
export declare const isAccessTokenBlacklisted: (jti: string) => Promise<boolean>;
export declare const isRefreshTokenBlacklisted: (token: string) => Promise<boolean>;
export declare const storeSession: (sessionId: string, userId: string, meta: {
    userAgent?: string;
    ipAddress?: string;
}) => Promise<void>;
export declare const invalidateSession: (sessionId: string, userId: string) => Promise<void>;
export declare const invalidateAllSessions: (userId: string) => Promise<void>;
export declare const isSessionActive: (sessionId: string) => Promise<boolean>;
//# sourceMappingURL=token.d.ts.map