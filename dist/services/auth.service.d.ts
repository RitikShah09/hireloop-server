import { RegisterInput, LoginInput } from '../validators/auth.validator';
export declare const registerUser: (
  input: RegisterInput,
  meta: {
    userAgent?: string;
    ipAddress?: string;
  }
) => Promise<{
  user: {
    id: string;
    email: string;
    role: import('@prisma/client').$Enums.Role;
  };
  accessToken: string;
  refreshToken: string;
}>;
export declare const loginUser: (
  input: LoginInput,
  meta: {
    userAgent?: string;
    ipAddress?: string;
  }
) => Promise<{
  user: {
    id: string;
    email: string;
    role: import('@prisma/client').$Enums.Role;
  };
  accessToken: string;
  refreshToken: string;
}>;
export declare const refreshAccessToken: (refreshToken: string) => Promise<{
  accessToken: string;
  refreshToken: string;
  user: {
    role: import('@prisma/client').$Enums.Role;
    id: string;
    email: string;
  } | null;
}>;
export declare const logoutUser: (
  userId: string,
  sessionId: string,
  jti: string,
  refreshToken?: string,
  logoutAll?: boolean
) => Promise<void>;
export declare const getUserSessions: (userId: string) => Promise<
  {
    id: string;
    createdAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }[]
>;
export declare const revokeSession: (
  userId: string,
  sessionId: string
) => Promise<void>;
export declare const getUserProfile: (userId: string) => Promise<{
  role: import('@prisma/client').$Enums.Role;
  id: string;
  email: string;
  isVerified: boolean;
  createdAt: Date;
  company: {
    name: string;
    id: string;
    logoUrl: string | null;
  } | null;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
}>;
export declare const changePassword: (
  userId: string,
  currentPassword: string,
  newPassword: string
) => Promise<void>;
//# sourceMappingURL=auth.service.d.ts.map
