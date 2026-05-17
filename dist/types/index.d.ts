import { Request } from 'express';
import { Role } from '@prisma/client';
export interface JwtPayload {
  userId: string;
  role: Role;
  sessionId: string;
  jti: string;
}
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
//# sourceMappingURL=index.d.ts.map
