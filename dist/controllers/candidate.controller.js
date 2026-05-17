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
exports.getSuggestedJobs = exports.deleteMilestone = exports.updateMilestone = exports.addMilestone = exports.getMilestones = exports.deleteEducation = exports.updateEducation = exports.addEducation = exports.getEducations = exports.deleteWorkExperience = exports.updateWorkExperience = exports.addWorkExperience = exports.getWorkExperiences = exports.deleteCertification = exports.updateCertification = exports.addCertification = exports.getCertifications = exports.getFullProfile = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const candidateService = __importStar(require("../services/candidate.service"));
const prisma_1 = __importDefault(require("../config/prisma"));
const errors_2 = require("../utils/errors");
const redis_1 = require("../config/redis");
const getCandidateId = async (userId) => {
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!candidate)
        throw new errors_2.AppError('Candidate profile not found', 404);
    return candidate.id;
};
exports.getFullProfile = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const profile = await candidateService.getCandidateFullProfile(candidateId);
    (0, response_1.sendSuccess)(res, 'Profile fetched', profile);
});
exports.getCertifications = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const cacheKey = redis_1.RedisKeys.candidateData(candidateId, 'certifications');
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Certifications fetched', JSON.parse(cached));
        return;
    }
    const certs = await candidateService.getCertifications(candidateId);
    await redis_1.redis.set(cacheKey, JSON.stringify(certs), 'EX', redis_1.REDIS_TTL.CANDIDATE_DATA);
    (0, response_1.sendSuccess)(res, 'Certifications fetched', certs);
});
exports.addCertification = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const cert = await candidateService.addCertification(candidateId, req.body);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'certifications'));
    (0, response_1.sendSuccess)(res, 'Certification added', cert, 201);
});
exports.updateCertification = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const cert = await candidateService.updateCertification(candidateId, req.params.id, req.body);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'certifications'));
    (0, response_1.sendSuccess)(res, 'Certification updated', cert);
});
exports.deleteCertification = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    await candidateService.deleteCertification(candidateId, req.params.id);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'certifications'));
    (0, response_1.sendSuccess)(res, 'Certification deleted');
});
exports.getWorkExperiences = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const cacheKey = redis_1.RedisKeys.candidateData(candidateId, 'experience');
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Work experiences fetched', JSON.parse(cached));
        return;
    }
    const experiences = await candidateService.getWorkExperiences(candidateId);
    await redis_1.redis.set(cacheKey, JSON.stringify(experiences), 'EX', redis_1.REDIS_TTL.CANDIDATE_DATA);
    (0, response_1.sendSuccess)(res, 'Work experiences fetched', experiences);
});
exports.addWorkExperience = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const exp = await candidateService.addWorkExperience(candidateId, req.body);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'experience'));
    (0, response_1.sendSuccess)(res, 'Work experience added', exp, 201);
});
exports.updateWorkExperience = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const exp = await candidateService.updateWorkExperience(candidateId, req.params.id, req.body);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'experience'));
    (0, response_1.sendSuccess)(res, 'Work experience updated', exp);
});
exports.deleteWorkExperience = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    await candidateService.deleteWorkExperience(candidateId, req.params.id);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'experience'));
    (0, response_1.sendSuccess)(res, 'Work experience deleted');
});
exports.getEducations = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const cacheKey = redis_1.RedisKeys.candidateData(candidateId, 'education');
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Education records fetched', JSON.parse(cached));
        return;
    }
    const educations = await candidateService.getEducations(candidateId);
    await redis_1.redis.set(cacheKey, JSON.stringify(educations), 'EX', redis_1.REDIS_TTL.CANDIDATE_DATA);
    (0, response_1.sendSuccess)(res, 'Education records fetched', educations);
});
exports.addEducation = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const edu = await candidateService.addEducation(candidateId, req.body);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'education'));
    (0, response_1.sendSuccess)(res, 'Education added', edu, 201);
});
exports.updateEducation = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const edu = await candidateService.updateEducation(candidateId, req.params.id, req.body);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'education'));
    (0, response_1.sendSuccess)(res, 'Education updated', edu);
});
exports.deleteEducation = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    await candidateService.deleteEducation(candidateId, req.params.id);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'education'));
    (0, response_1.sendSuccess)(res, 'Education deleted');
});
exports.getMilestones = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const cacheKey = redis_1.RedisKeys.candidateData(candidateId, 'milestones');
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Milestones fetched', JSON.parse(cached));
        return;
    }
    const milestones = await candidateService.getMilestones(candidateId);
    await redis_1.redis.set(cacheKey, JSON.stringify(milestones), 'EX', redis_1.REDIS_TTL.CANDIDATE_DATA);
    (0, response_1.sendSuccess)(res, 'Milestones fetched', milestones);
});
exports.addMilestone = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const milestone = await candidateService.addMilestone(candidateId, req.body);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'milestones'));
    (0, response_1.sendSuccess)(res, 'Milestone added', milestone, 201);
});
exports.updateMilestone = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const milestone = await candidateService.updateMilestone(candidateId, req.params.id, req.body);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'milestones'));
    (0, response_1.sendSuccess)(res, 'Milestone updated', milestone);
});
exports.deleteMilestone = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    await candidateService.deleteMilestone(candidateId, req.params.id);
    await redis_1.redis.del(redis_1.RedisKeys.candidateData(candidateId, 'milestones'));
    (0, response_1.sendSuccess)(res, 'Milestone deleted');
});
exports.getSuggestedJobs = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidateId = await getCandidateId(user.userId);
    const cacheKey = redis_1.RedisKeys.suggestedJobs(candidateId);
    const cached = await redis_1.redis.get(cacheKey);
    if (cached) {
        (0, response_1.sendSuccess)(res, 'Suggested jobs fetched', JSON.parse(cached));
        return;
    }
    const jobs = await candidateService.getSuggestedJobs(candidateId);
    await redis_1.redis.set(cacheKey, JSON.stringify(jobs), 'EX', redis_1.REDIS_TTL.SUGGESTED_JOBS);
    (0, response_1.sendSuccess)(res, 'Suggested jobs fetched', jobs);
});
//# sourceMappingURL=candidate.controller.js.map