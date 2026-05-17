'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ragCandidateQuery =
  exports.semanticCandidateSearch =
  exports.storeResumeEmbedding =
  exports.generateEmbedding =
    void 0;
const gemini_1 = require('../config/gemini');
const prisma_1 = __importDefault(require('../config/prisma'));
const logger_1 = require('../config/logger');
const env_1 = require('../config/env');
const generateEmbedding = async (text) => {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env_1.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'voyage-large-2',
        input: text.slice(0, 16000),
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Voyage AI ${response.status}: ${errText}`);
    }
    const data = await response.json();
    return data.data[0].embedding;
  } catch (err) {
    logger_1.logger.error('Embedding generation failed:', err);
    return [];
  }
};
exports.generateEmbedding = generateEmbedding;
const storeResumeEmbedding = async (resumeId, text) => {
  try {
    const embedding = await (0, exports.generateEmbedding)(text);
    if (!embedding.length) return;
    await prisma_1.default.$executeRaw`
      UPDATE resumes
      SET embedding = ${JSON.stringify(embedding)}::vector
      WHERE id = ${resumeId}
    `;
    logger_1.logger.info(`Embedding stored for resume ${resumeId}`);
  } catch (err) {
    logger_1.logger.error('Failed to store embedding:', err);
  }
};
exports.storeResumeEmbedding = storeResumeEmbedding;
const semanticCandidateSearch = async (
  jobDescription,
  jobSkills,
  jobId,
  limit = 20
) => {
  try {
    const queryText = `${jobDescription} Skills required: ${jobSkills.join(', ')}`;
    const embedding = await (0, exports.generateEmbedding)(queryText);
    if (!embedding.length) return [];
    const results = await prisma_1.default.$queryRaw`
      SELECT r.id AS resume_id, r.candidate_id,
        1 - (r.embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity
      FROM resumes r
      WHERE r.embedding IS NOT NULL
      ORDER BY r.embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT ${limit}
    `;
    return results.map((r) => ({
      resumeId: r.resume_id,
      candidateId: r.candidate_id,
      similarity: r.similarity,
    }));
  } catch (err) {
    logger_1.logger.error('Semantic search failed:', err);
    return [];
  }
};
exports.semanticCandidateSearch = semanticCandidateSearch;
const ragCandidateQuery = async (query, jobId) => {
  try {
    const applications = await prisma_1.default.application.findMany({
      where: { jobId, aiScore: { not: null } },
      include: {
        candidate: {
          select: { firstName: true, lastName: true, skills: true },
        },
        resume: { select: { parsedText: true } },
      },
      orderBy: { aiScore: 'desc' },
      take: 10,
    });
    if (!applications.length)
      return 'No screened candidates found for this job.';
    const context = applications
      .map(
        (
          a,
          i
        ) => `--- CANDIDATE ${i + 1}: ${a.candidate.firstName} ${a.candidate.lastName} ---
AI Score: ${a.aiScore}/100
Skills: ${a.candidate.skills.join(', ')}
Resume Excerpt: ${(a.resume.parsedText || '').slice(0, 500)}`
      )
      .join('\n\n');
    const model = (0, gemini_1.getModel)();
    const result =
      await model.generateContent(`You are an expert AI recruiter. Answer based ONLY on the provided candidate data. Be specific and cite candidate names.

CANDIDATE POOL DATA:
${context}

RECRUITER QUESTION: ${query}`);
    return result.response.text();
  } catch (err) {
    logger_1.logger.error('RAG query failed:', err);
    return 'Failed to process your query. Please try again.';
  }
};
exports.ragCandidateQuery = ragCandidateQuery;
//# sourceMappingURL=rag.service.js.map
