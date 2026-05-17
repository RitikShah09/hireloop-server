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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.getPublicCompanyProfile =
  exports.uploadCompanyLogo =
  exports.updateCompanyProfile =
  exports.getCompanyProfile =
  exports.uploadCandidateAvatar =
  exports.updateCandidateProfile =
  exports.getCandidateProfile =
    void 0;
const errors_1 = require('../utils/errors');
const response_1 = require('../utils/response');
const prisma_1 = __importDefault(require('../config/prisma'));
const imagekitService = __importStar(require('../services/imagekit.service'));
const redis_1 = require('../config/redis');
exports.getCandidateProfile = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const cacheKey = redis_1.RedisKeys.candidateProfile(user.userId);
  const cached = await redis_1.redis.get(cacheKey);
  if (cached) {
    (0, response_1.sendSuccess)(res, 'Profile fetched', JSON.parse(cached));
    return;
  }
  const candidate = await prisma_1.default.candidate.findUnique({
    where: { userId: user.userId },
    include: { user: { select: { email: true } } },
  });
  if (!candidate) throw new errors_1.AppError('Profile not found', 404);
  await redis_1.redis.set(
    cacheKey,
    JSON.stringify(candidate),
    'EX',
    redis_1.REDIS_TTL.PROFILE
  );
  (0, response_1.sendSuccess)(res, 'Profile fetched', candidate);
});
exports.updateCandidateProfile = (0, errors_1.asyncHandler)(
  async (req, res) => {
    const user = req.user;
    const {
      firstName,
      lastName,
      phone,
      location,
      bio,
      skills,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
    } = req.body;
    const candidate = await prisma_1.default.candidate.update({
      where: { userId: user.userId },
      data: {
        firstName,
        lastName,
        phone,
        location,
        bio,
        skills,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
      },
    });
    await redis_1.redis.del(redis_1.RedisKeys.candidateProfile(user.userId));
    await redis_1.redis.del(redis_1.RedisKeys.suggestedJobs(candidate.id));
    (0, response_1.sendSuccess)(res, 'Profile updated', candidate);
  }
);
exports.uploadCandidateAvatar = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  if (!req.file) throw new errors_1.AppError('Image is required', 400);
  const candidate = await prisma_1.default.candidate.findUnique({
    where: { userId: user.userId },
  });
  if (!candidate) throw new errors_1.AppError('Profile not found', 404);
  if (candidate.avatarFileId) {
    await imagekitService.deleteFile(candidate.avatarFileId);
  }
  const { url, fileId } = await imagekitService.uploadCandidateAvatar(
    req.file.buffer,
    req.file.originalname,
    candidate.id
  );
  const updated = await prisma_1.default.candidate.update({
    where: { userId: user.userId },
    data: { avatarUrl: url, avatarFileId: fileId },
  });
  await redis_1.redis.del(redis_1.RedisKeys.candidateProfile(user.userId));
  (0, response_1.sendSuccess)(res, 'Avatar updated', {
    avatarUrl: updated.avatarUrl,
  });
});
exports.getCompanyProfile = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const cacheKey = redis_1.RedisKeys.companyProfile(user.userId);
  const cached = await redis_1.redis.get(cacheKey);
  if (cached) {
    (0, response_1.sendSuccess)(
      res,
      'Company profile fetched',
      JSON.parse(cached)
    );
    return;
  }
  const company = await prisma_1.default.company.findUnique({
    where: { userId: user.userId },
    include: { user: { select: { email: true } } },
  });
  if (!company) throw new errors_1.AppError('Company profile not found', 404);
  await redis_1.redis.set(
    cacheKey,
    JSON.stringify(company),
    'EX',
    redis_1.REDIS_TTL.PROFILE
  );
  (0, response_1.sendSuccess)(res, 'Company profile fetched', company);
});
exports.updateCompanyProfile = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  const { name, description, website, industry, size, location } = req.body;
  const company = await prisma_1.default.company.update({
    where: { userId: user.userId },
    data: { name, description, website, industry, size, location },
  });
  await Promise.all([
    redis_1.redis.del(redis_1.RedisKeys.companyProfile(user.userId)),
    redis_1.redis.del(redis_1.RedisKeys.publicCompany(company.id)),
  ]);
  (0, response_1.sendSuccess)(res, 'Company profile updated', company);
});
exports.uploadCompanyLogo = (0, errors_1.asyncHandler)(async (req, res) => {
  const user = req.user;
  if (!req.file) throw new errors_1.AppError('Image is required', 400);
  const company = await prisma_1.default.company.findUnique({
    where: { userId: user.userId },
  });
  if (!company) throw new errors_1.AppError('Company not found', 404);
  if (company.logoFileId) {
    await imagekitService.deleteFile(company.logoFileId);
  }
  const { url, fileId } = await imagekitService.uploadCompanyLogo(
    req.file.buffer,
    req.file.originalname,
    company.id
  );
  const updated = await prisma_1.default.company.update({
    where: { userId: user.userId },
    data: { logoUrl: url, logoFileId: fileId },
  });
  await Promise.all([
    redis_1.redis.del(redis_1.RedisKeys.companyProfile(user.userId)),
    redis_1.redis.del(redis_1.RedisKeys.publicCompany(company.id)),
  ]);
  (0, response_1.sendSuccess)(res, 'Logo updated', {
    logoUrl: updated.logoUrl,
  });
});
exports.getPublicCompanyProfile = (0, errors_1.asyncHandler)(
  async (req, res) => {
    const companyId = req.params.id;
    const cacheKey = redis_1.RedisKeys.publicCompany(companyId);
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
      (0, response_1.sendSuccess)(res, 'Company fetched', JSON.parse(cached));
      return;
    }
    const company = await prisma_1.default.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        logoUrl: true,
        industry: true,
        size: true,
        location: true,
        jobs: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            location: true,
            isRemote: true,
            shareableSlug: true,
            createdAt: true,
          },
          take: 10,
        },
      },
    });
    if (!company) throw new errors_1.AppError('Company not found', 404);
    await redis_1.redis.set(
      cacheKey,
      JSON.stringify(company),
      'EX',
      redis_1.REDIS_TTL.PUBLIC_PROFILE
    );
    (0, response_1.sendSuccess)(res, 'Company fetched', company);
  }
);
//# sourceMappingURL=profile.controller.js.map
