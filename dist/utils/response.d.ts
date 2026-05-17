import { Response } from 'express';
import { PaginationMeta } from '../types';
export declare const sendSuccess: <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode?: number,
  meta?: PaginationMeta
) => Response;
export declare const sendError: (
  res: Response,
  message: string,
  statusCode?: number,
  errors?: Record<string, string[]>
) => Response;
export declare const getPaginationParams: (query: {
  page?: string;
  limit?: string;
}) => {
  page: number;
  limit: number;
  skip: number;
};
export declare const buildPaginationMeta: (
  total: number,
  page: number,
  limit: number
) => PaginationMeta;
//# sourceMappingURL=response.d.ts.map
