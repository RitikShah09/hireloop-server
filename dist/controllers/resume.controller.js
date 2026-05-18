"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultResume = exports.deleteResume = exports.getResumes = exports.uploadResume = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = require("../config/logger");
const imagekitService = __importStar(require("../services/imagekit.service"));
const redis_1 = require("../config/redis");
const pdf_parse_1 = require("pdf-parse");
exports.uploadResume = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId: user.userId },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate profile not found', 404);
    if (!req.file)
        throw new errors_1.AppError('Resume file is required', 400);
    let parsedText = '';
    try {
        const parser = new pdf_parse_1.PDFParse({ data: req.file.buffer });
        parsedText = (await parser.getText()).text;
        await parser.destroy();
        if (!parsedText)
            logger_1.logger.warn('PDF parsed but text is empty — may be a scanned/image PDF');
        else
            logger_1.logger.info(`PDF parsed successfully: ${parsedText.length} characters extracted`);
    }
    catch (parseErr) {
        logger_1.logger.error('PDF parsing failed:', parseErr);
    }
    const { url, fileId } = await imagekitService.uploadResume(req.file.buffer, req.file.originalname, candidate.id);
    const resume = await prisma_1.default.resume.create({
        data: {
            candidateId: candidate.id,
            fileName: req.file.originalname,
            fileUrl: url,
            fileId,
            parsedText,
        },
    });
    await redis_1.redis.del(redis_1.RedisKeys.resumesCache(candidate.id));
    (0, response_1.sendSuccess)(res, 'Resume uploaded', resume, 201);
});
exports.getResumes = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId: user.userId },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate profile not found', 404);
    const cacheKey = redis_1.RedisKeys.resumesCache(candidate.id);
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Resumes fetched', JSON.parse(cached));
        return;
    }
    const resumes = await prisma_1.default.resume.findMany({
        where: { candidateId: candidate.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            fileName: true,
            fileUrl: true,
            isDefault: true,
            createdAt: true,
        },
    });
    await redis_1.redis.set(cacheKey, JSON.stringify(resumes), 'EX', redis_1.REDIS_TTL.RESUMES);
    (0, response_1.sendSuccess)(res, 'Resumes fetched', resumes);
});
exports.deleteResume = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId: user.userId },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate not found', 404);
    const resume = await prisma_1.default.resume.findFirst({
        where: { id: req.params.id, candidateId: candidate.id },
    });
    if (!resume)
        throw new errors_1.AppError('Resume not found', 404);
    await imagekitService.deleteFile(resume.fileId);
    await prisma_1.default.resume.delete({ where: { id: req.params.id } });
    await redis_1.redis.del(redis_1.RedisKeys.resumesCache(candidate.id));
    (0, response_1.sendSuccess)(res, 'Resume deleted');
});
exports.setDefaultResume = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId: user.userId },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate not found', 404);
    await prisma_1.default.$transaction([
        prisma_1.default.resume.updateMany({
            where: { candidateId: candidate.id },
            data: { isDefault: false },
        }),
        prisma_1.default.resume.update({
            where: { id: req.params.id },
            data: { isDefault: true },
        }),
    ]);
    await redis_1.redis.del(redis_1.RedisKeys.resumesCache(candidate.id));
    (0, response_1.sendSuccess)(res, 'Default resume updated');
});
//# sourceMappingURL=resume.controller.js.map