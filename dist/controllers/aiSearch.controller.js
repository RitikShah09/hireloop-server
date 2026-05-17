'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.aiSearchJobs = void 0;
const errors_1 = require('../utils/errors');
const response_1 = require('../utils/response');
const ai_service_1 = require('../services/ai.service');
const prisma_1 = __importDefault(require('../config/prisma'));
exports.aiSearchJobs = (0, errors_1.asyncHandler)(async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    throw new errors_1.AppError('Query must be at least 3 characters', 400);
  }
  const jobs = await prisma_1.default.job.findMany({
    where: { status: 'ACTIVE' },
    include: { company: { select: { name: true } } },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });
  const jobsForAI = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description.slice(0, 300),
    skills: j.skills,
    location: j.location || undefined,
    isRemote: j.isRemote,
    company: j.company?.name,
  }));
  if (jobsForAI.length === 0) {
    (0, response_1.sendSuccess)(res, 'No active jobs found', {
      matches: [],
      suggestion: 'Check back later for new opportunities.',
    });
    return;
  }
  const result = await (0, ai_service_1.aiJobSearch)(query, jobsForAI);
  const matchIds = result.matches.map((m) => m.id);
  const matchedJobs = await prisma_1.default.job.findMany({
    where: { id: { in: matchIds } },
    include: {
      company: { select: { name: true, logoUrl: true, location: true } },
    },
  });
  const enriched = result.matches.map((m) => ({
    ...m,
    job: matchedJobs.find((j) => j.id === m.id),
  }));
  (0, response_1.sendSuccess)(res, 'AI search complete', {
    matches: enriched,
    suggestion: result.suggestion,
  });
});
//# sourceMappingURL=aiSearch.controller.js.map
