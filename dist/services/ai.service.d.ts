interface ScreeningResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}
export declare const screenResume: (
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  requirements: string[],
  skills: string[]
) => Promise<ScreeningResult>;
export declare const generatePersonalizedEmail: (
  type: 'shortlisted' | 'rejected',
  candidateName: string,
  jobTitle: string,
  companyName: string,
  aiSummary?: string
) => Promise<{
  subject: string;
  body: string;
}>;
export declare const chatWithCandidatePool: (
  query: string,
  candidates: Array<{
    name: string;
    score: number;
    skills: string[];
    summary: string;
  }>
) => Promise<string>;
export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    responsibilities: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    techStack: string[];
    link?: string;
  }>;
  certifications?: string[];
}
export declare const buildResumeFromScratch: (userInput: {
  name: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  yearsOfExperience: string;
  skills: string;
  education: string;
  previousRoles?: string;
}) => Promise<ResumeData>;
export declare const buildResumeFromUpload: (
  parsedResumeText: string,
  targetRole?: string
) => Promise<ResumeData>;
export declare const aiJobSearch: (
  query: string,
  jobs: Array<{
    id: string;
    title: string;
    description: string;
    skills: string[];
    location?: string;
    isRemote: boolean;
    company?: string;
  }>
) => Promise<{
  matches: Array<{
    id: string;
    relevanceScore: number;
    reason: string;
  }>;
  suggestion: string;
}>;
export declare const enhanceResumeSection: (
  section: string,
  currentValue: string,
  prompt: string
) => Promise<string>;
export {};
//# sourceMappingURL=ai.service.d.ts.map
