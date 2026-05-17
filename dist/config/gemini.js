"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModel = exports.GEMINI_MODEL = exports.genAI = void 0;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("./env");
exports.genAI = new generative_ai_1.GoogleGenerativeAI(env_1.env.GEMINI_API_KEY);
exports.GEMINI_MODEL = 'gemini-2.5-flash';
const getModel = () => exports.genAI.getGenerativeModel({ model: exports.GEMINI_MODEL });
exports.getModel = getModel;
//# sourceMappingURL=gemini.js.map