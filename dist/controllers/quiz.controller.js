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
exports.deactivateQuiz = exports.submitQuiz = exports.startQuiz = exports.getQuizAttempts = exports.getQuizByJob = exports.createQuiz = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const prisma_1 = __importDefault(require("../config/prisma"));
const quizService = __importStar(require("../services/quiz.service"));
// POST /api/v1/quizzes (company: generate quiz for a job)
exports.createQuiz = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const { jobId, difficulty = 'medium', questionCount = 10 } = req.body;
    if (!jobId)
        throw new errors_1.AppError('jobId is required', 400);
    const job = await prisma_1.default.job.findFirst({
        where: { id: jobId, companyId: company.id },
    });
    if (!job)
        throw new errors_1.AppError('Job not found', 404);
    // Check if quiz already exists for this job
    const existing = await prisma_1.default.quiz.findFirst({
        where: { jobId, isActive: true },
    });
    if (existing)
        throw new errors_1.AppError('Quiz already exists for this job. Deactivate the existing one first.', 409);
    const questions = await quizService.generateQuizQuestions(job.title, job.skills, difficulty, questionCount);
    const quiz = await prisma_1.default.quiz.create({
        data: {
            jobId,
            title: `${job.title} Assessment`,
            questions: questions,
            timeLimit: 15,
            passingScore: 60,
        },
    });
    (0, response_1.sendSuccess)(res, 'Quiz created successfully', quiz, 201);
});
// GET /api/v1/quizzes/job/:jobId (get quiz for a job - company sees full, candidate sees without answers)
exports.getQuizByJob = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const { jobId } = req.params;
    const quiz = await prisma_1.default.quiz.findFirst({
        where: { jobId: jobId, isActive: true },
    });
    if (!quiz)
        throw new errors_1.AppError('No active quiz for this job', 404);
    if (user.role === 'CANDIDATE') {
        // Check if candidate has already attempted
        const candidate = await prisma_1.default.candidate.findUnique({
            where: { userId: user.userId },
        });
        if (!candidate)
            throw new errors_1.AppError('Candidate not found', 404);
        const attempt = await prisma_1.default.quizAttempt.findUnique({
            where: {
                quizId_candidateId: { quizId: quiz.id, candidateId: candidate.id },
            },
        });
        // Strip correct answers from questions for candidates
        const safeQuestions = quiz.questions.map((q) => ({
            question: q.question,
            options: q.options,
        }));
        (0, response_1.sendSuccess)(res, 'Quiz fetched', {
            id: quiz.id,
            title: quiz.title,
            questionCount: safeQuestions.length,
            timeLimit: quiz.timeLimit,
            passingScore: quiz.passingScore,
            questions: attempt?.status === 'COMPLETED' ? quiz.questions : safeQuestions,
            attempt: attempt || null,
        });
        return;
    }
    // Company sees everything
    (0, response_1.sendSuccess)(res, 'Quiz fetched', quiz);
});
// GET /api/v1/quizzes/:id/attempts (company: see all attempts for a quiz)
exports.getQuizAttempts = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    const attempts = await prisma_1.default.quizAttempt.findMany({
        where: { quizId: req.params.id },
        include: {
            candidate: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    skills: true,
                },
            },
        },
        orderBy: { score: 'desc' },
    });
    (0, response_1.sendSuccess)(res, 'Attempts fetched', attempts);
});
// POST /api/v1/quizzes/:id/start (candidate: start quiz)
exports.startQuiz = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId: user.userId },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate profile not found', 404);
    const quiz = await prisma_1.default.quiz.findUnique({
        where: { id: req.params.id },
    });
    if (!quiz || !quiz.isActive)
        throw new errors_1.AppError('Quiz not found or inactive', 404);
    const existing = await prisma_1.default.quizAttempt.findUnique({
        where: {
            quizId_candidateId: { quizId: quiz.id, candidateId: candidate.id },
        },
    });
    if (existing)
        throw new errors_1.AppError('You have already attempted this quiz', 409);
    const attempt = await prisma_1.default.quizAttempt.create({
        data: {
            quizId: quiz.id,
            candidateId: candidate.id,
            answers: [],
            status: 'PENDING',
            startedAt: new Date(),
        },
    });
    (0, response_1.sendSuccess)(res, 'Quiz started', { attemptId: attempt.id, startedAt: attempt.startedAt }, 201);
});
// POST /api/v1/quizzes/:id/submit (candidate: submit answers)
exports.submitQuiz = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const candidate = await prisma_1.default.candidate.findUnique({
        where: { userId: user.userId },
    });
    if (!candidate)
        throw new errors_1.AppError('Candidate profile not found', 404);
    const { answers } = req.body;
    if (!Array.isArray(answers))
        throw new errors_1.AppError('answers must be an array', 400);
    const quiz = await prisma_1.default.quiz.findUnique({
        where: { id: req.params.id },
    });
    if (!quiz)
        throw new errors_1.AppError('Quiz not found', 404);
    const attempt = await prisma_1.default.quizAttempt.findUnique({
        where: {
            quizId_candidateId: { quizId: quiz.id, candidateId: candidate.id },
        },
    });
    if (!attempt)
        throw new errors_1.AppError('You must start the quiz first', 400);
    if (attempt.status === 'COMPLETED')
        throw new errors_1.AppError('Quiz already submitted', 409);
    const questions = quiz.questions;
    const { score, correct, total, results } = quizService.scoreQuizAttempt(questions, answers);
    const passed = score >= quiz.passingScore;
    const updated = await prisma_1.default.quizAttempt.update({
        where: { id: attempt.id },
        data: {
            answers: answers,
            score,
            passed,
            status: 'COMPLETED',
            completedAt: new Date(),
        },
    });
    (0, response_1.sendSuccess)(res, 'Quiz submitted', {
        score,
        correct,
        total,
        passed,
        passingScore: quiz.passingScore,
        results,
    });
});
// DELETE /api/v1/quizzes/:id (company: deactivate quiz)
exports.deactivateQuiz = (0, errors_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const company = await prisma_1.default.company.findUnique({
        where: { userId: user.userId },
    });
    if (!company)
        throw new errors_1.AppError('Company not found', 404);
    await prisma_1.default.quiz.update({
        where: { id: req.params.id },
        data: { isActive: false },
    });
    (0, response_1.sendSuccess)(res, 'Quiz deactivated');
});
//# sourceMappingURL=quiz.controller.js.map