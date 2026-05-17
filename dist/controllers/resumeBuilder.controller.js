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
exports.enhanceSection =
  exports.buildFromExistingResume =
  exports.buildFromUpload =
  exports.buildFromScratch =
    void 0;
const errors_1 = require('../utils/errors');
const response_1 = require('../utils/response');
const ai_service_1 = require('../services/ai.service');
const prisma_1 = __importDefault(require('../config/prisma'));
const node_console_1 = require('node:console');
const pdf_parse_1 = require('pdf-parse');
exports.buildFromScratch = (0, errors_1.asyncHandler)(async (req, res) => {
  const {
    name,
    email,
    phone,
    location,
    targetRole,
    yearsOfExperience,
    skills,
    education,
    previousRoles,
  } = req.body;
  if (!name || !email || !targetRole || !skills) {
    throw new errors_1.AppError(
      'name, email, targetRole and skills are required',
      400
    );
  }
  const resumeData = await (0, ai_service_1.buildResumeFromScratch)({
    name,
    email,
    phone,
    location,
    targetRole,
    yearsOfExperience: yearsOfExperience || '0',
    skills,
    education: education || '',
    previousRoles,
  });
  (0, response_1.sendSuccess)(
    res,
    'Resume generated successfully',
    resumeData,
    201
  );
});
exports.buildFromUpload = (0, errors_1.asyncHandler)(async (req, res) => {
  if (!req.file) throw new errors_1.AppError('PDF file is required', 400);
  const { targetRole } = req.body;
  let parsedText = '';
  try {
    const parser = new pdf_parse_1.PDFParse({
      data: req.file.buffer,
    });
    parsedText = (await parser.getText()).text.trim();
    await parser.destroy();
  } catch (error) {
    (0, node_console_1.log)('Error parsing PDF:', error);
    throw new errors_1.AppError(
      'Failed to parse PDF. Please ensure it is a valid PDF file.',
      400
    );
  }
  if (!parsedText.trim())
    throw new errors_1.AppError('PDF appears to be empty or unreadable', 400);
  const resumeData = await (0, ai_service_1.buildResumeFromUpload)(
    parsedText,
    targetRole
  );
  (0, response_1.sendSuccess)(
    res,
    'Resume enhanced successfully',
    resumeData,
    201
  );
});
exports.buildFromExistingResume = (0, errors_1.asyncHandler)(
  async (req, res) => {
    const user = req.user;
    const candidate = await prisma_1.default.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate)
      throw new errors_1.AppError('Candidate profile not found', 404);
    const resume = await prisma_1.default.resume.findFirst({
      where: { id: req.params.resumeId, candidateId: candidate.id },
    });
    if (!resume) throw new errors_1.AppError('Resume not found', 404);
    if (!resume.parsedText)
      throw new errors_1.AppError('Resume has no parseable text', 400);
    const { targetRole } = req.body;
    const resumeData = await (0, ai_service_1.buildResumeFromUpload)(
      resume.parsedText,
      targetRole
    );
    (0, response_1.sendSuccess)(
      res,
      'Resume enhanced from existing',
      resumeData,
      201
    );
  }
);
exports.enhanceSection = (0, errors_1.asyncHandler)(async (req, res) => {
  const { section, currentValue, prompt } = req.body;
  if (!section || !prompt)
    throw new errors_1.AppError('section and prompt are required', 400);
  const { enhanceResumeSection } = await Promise.resolve().then(() =>
    __importStar(require('../services/ai.service'))
  );
  const enhanced = await enhanceResumeSection(
    section,
    currentValue || '',
    prompt
  );
  (0, response_1.sendSuccess)(res, 'Section enhanced', { enhanced });
});
//# sourceMappingURL=resumeBuilder.controller.js.map
