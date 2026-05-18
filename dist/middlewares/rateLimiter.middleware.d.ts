import { Request, Response, NextFunction } from 'express';
export declare const ipLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const userLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const aiLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rateLimiter.middleware.d.ts.map