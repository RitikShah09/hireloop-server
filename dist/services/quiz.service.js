"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreQuizAttempt = exports.generateQuizQuestions = void 0;
const gemini_1 = require("../config/gemini");
const logger_1 = require("../config/logger");
const extractJSON = (raw) => {
    const text = raw.trim();
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock)
        return codeBlock[1].trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch)
        return jsonMatch[0];
    return text;
};
const generateQuizQuestions = async (jobTitle, skills, difficulty = 'medium', count = 10) => {
    const prompt = `You are a technical hiring expert. Generate ${count} multiple-choice quiz questions to assess a candidate for the role: ${jobTitle}.

Skills to test: ${skills.slice(0, 5).join(', ')}
Difficulty: ${difficulty}

Rules:
- Questions must be practical and relevant to the job
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer

Return ONLY a JSON array:
[
  {
    "question": "What does the Event Loop do in Node.js?",
    "options": ["Handles async operations", "Manages database connections", "Compiles JavaScript", "Handles HTTP routing"],
    "correctIndex": 0,
    "explanation": "The Event Loop allows Node.js to perform non-blocking I/O operations by offloading operations to the system kernel."
  }
]`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(prompt);
        const raw = result.response.text();
        const cleaned = extractJSON(raw);
        const questions = JSON.parse(cleaned);
        // Validate structure
        return questions.filter(q => q.question &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            typeof q.correctIndex === 'number' &&
            q.correctIndex >= 0 &&
            q.correctIndex <= 3).slice(0, count);
    }
    catch (err) {
        logger_1.logger.error('Quiz generation failed:', err);
        throw new Error('Failed to generate quiz questions. Please try again.');
    }
};
exports.generateQuizQuestions = generateQuizQuestions;
const scoreQuizAttempt = (questions, answers) => {
    const results = questions.map((q, i) => ({
        correct: answers[i] === q.correctIndex,
        explanation: q.explanation,
    }));
    const correct = results.filter(r => r.correct).length;
    const total = questions.length;
    const score = Math.round((correct / total) * 100);
    return { score, correct, total, results };
};
exports.scoreQuizAttempt = scoreQuizAttempt;
//# sourceMappingURL=quiz.service.js.map