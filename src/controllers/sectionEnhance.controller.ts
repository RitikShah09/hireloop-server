import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { getModel } from '../config/gemini';
import { logger } from '../config/logger';

const extractText = (raw: string): string => {
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  return raw.trim();
};

export const enhanceSection = asyncHandler(
  async (req: Request, res: Response) => {
    const { section, context, userPrompt } = req.body;
    if (!section || !userPrompt)
      throw new AppError('section and userPrompt are required', 400);

    const sectionPrompts: Record<string, string> = {
      summary: `Enhance this professional summary for a resume. Make it compelling and ATS-friendly. Return ONLY the enhanced text, no quotes, no JSON.
Current: ${context}
Instruction: ${userPrompt}`,
      experience: `Enhance these work experience bullet points. Make them action-oriented with strong verbs. Return ONLY the enhanced bullet points separated by newlines, no JSON.
Current: ${context}
Instruction: ${userPrompt}`,
      project: `Enhance this project description for a resume. Return ONLY the enhanced text.
Current: ${context}
Instruction: ${userPrompt}`,
      education: `Enhance this education entry details. Return ONLY the enhanced text.
Current: ${context}
Instruction: ${userPrompt}`,
      skills: `Suggest additional relevant skills based on this context. Return ONLY a comma-separated list of skills to add.
Context: ${context}
Instruction: ${userPrompt}`,
      hobbies: `Write professional hobbies/interests for a resume. Return ONLY the text.
Instruction: ${userPrompt}`,
    };

    const prompt =
      sectionPrompts[section] ||
      `Enhance this resume section content. Return ONLY the improved text.\nContent: ${context}\nInstruction: ${userPrompt}`;

    try {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const enhanced = extractText(result.response.text());
      sendSuccess(res, 'Enhanced successfully', enhanced);
    } catch (err) {
      logger.error('Section enhance failed:', err);
      throw new AppError('AI enhancement failed. Please try again.', 500);
    }
  }
);
