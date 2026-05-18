"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceSection = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const gemini_1 = require("../config/gemini");
const logger_1 = require("../config/logger");
const extractText = (raw) => {
    const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock)
        return codeBlock[1].trim();
    return raw.trim();
};
exports.enhanceSection = (0, errors_1.asyncHandler)(async (req, res) => {
    const { section, context, userPrompt } = req.body;
    if (!section || !userPrompt)
        throw new errors_1.AppError('section and userPrompt are required', 400);
    const sectionPrompts = {
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
    const prompt = sectionPrompts[section] ||
        `Enhance this resume section content. Return ONLY the improved text.\nContent: ${context}\nInstruction: ${userPrompt}`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(prompt);
        const enhanced = extractText(result.response.text());
        (0, response_1.sendSuccess)(res, 'Enhanced successfully', enhanced);
    }
    catch (err) {
        logger_1.logger.error('Section enhance failed:', err);
        throw new errors_1.AppError('AI enhancement failed. Please try again.', 500);
    }
});
//# sourceMappingURL=sectionEnhance.controller.js.map