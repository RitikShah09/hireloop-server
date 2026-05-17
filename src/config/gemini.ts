import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const getModel = () => genAI.getGenerativeModel({ model: GEMINI_MODEL });
