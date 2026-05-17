import { getModel } from '../config/gemini';
import prisma from '../config/prisma';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
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

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };
    return data.data[0].embedding;
  } catch (err) {
    logger.error('Embedding generation failed:', err);
    return [];
  }
};

export const storeResumeEmbedding = async (
  resumeId: string,
  text: string
): Promise<void> => {
  try {
    const embedding = await generateEmbedding(text);
    if (!embedding.length) return;

    await prisma.$executeRaw`
      UPDATE resumes
      SET embedding = ${JSON.stringify(embedding)}::vector
      WHERE id = ${resumeId}
    `;
    logger.info(`Embedding stored for resume ${resumeId}`);
  } catch (err) {
    logger.error('Failed to store embedding:', err);
  }
};

export const semanticCandidateSearch = async (
  jobDescription: string,
  jobSkills: string[],
  jobId: string,
  limit = 20
): Promise<
  Array<{ resumeId: string; candidateId: string; similarity: number }>
> => {
  try {
    const queryText = `${jobDescription} Skills required: ${jobSkills.join(', ')}`;
    const embedding = await generateEmbedding(queryText);
    if (!embedding.length) return [];

    const results = await prisma.$queryRaw<
      Array<{ resume_id: string; candidate_id: string; similarity: number }>
    >`
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
    logger.error('Semantic search failed:', err);
    return [];
  }
};

export const ragCandidateQuery = async (
  query: string,
  jobId: string
): Promise<string> => {
  try {
    const applications = await prisma.application.findMany({
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
        (a, i) =>
          `--- CANDIDATE ${i + 1}: ${a.candidate.firstName} ${a.candidate.lastName} ---
AI Score: ${a.aiScore}/100
Skills: ${a.candidate.skills.join(', ')}
Resume Excerpt: ${(a.resume.parsedText || '').slice(0, 500)}`
      )
      .join('\n\n');

    const model = getModel();
    const result = await model.generateContent(
      `You are an expert AI recruiter. Answer based ONLY on the provided candidate data. Be specific and cite candidate names.

CANDIDATE POOL DATA:
${context}

RECRUITER QUESTION: ${query}`
    );

    return result.response.text();
  } catch (err) {
    logger.error('RAG query failed:', err);
    return 'Failed to process your query. Please try again.';
  }
};
