export declare const generateEmbedding: (text: string) => Promise<number[]>;
export declare const storeResumeEmbedding: (resumeId: string, text: string) => Promise<void>;
export declare const semanticCandidateSearch: (jobDescription: string, jobSkills: string[], jobId: string, limit?: number) => Promise<Array<{
    resumeId: string;
    candidateId: string;
    similarity: number;
}>>;
export declare const ragCandidateQuery: (query: string, jobId: string) => Promise<string>;
//# sourceMappingURL=rag.service.d.ts.map