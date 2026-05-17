export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
export declare const generateQuizQuestions: (
  jobTitle: string,
  skills: string[],
  difficulty?: 'easy' | 'medium' | 'hard',
  count?: number
) => Promise<QuizQuestion[]>;
export declare const scoreQuizAttempt: (
  questions: QuizQuestion[],
  answers: number[]
) => {
  score: number;
  correct: number;
  total: number;
  results: Array<{
    correct: boolean;
    explanation: string;
  }>;
};
//# sourceMappingURL=quiz.service.d.ts.map
