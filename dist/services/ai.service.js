"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceResumeSection = exports.aiJobSearch = exports.buildResumeFromUpload = exports.buildResumeFromScratch = exports.chatWithCandidatePool = exports.generatePersonalizedEmail = exports.screenResume = void 0;
const gemini_1 = require("../config/gemini");
const logger_1 = require("../config/logger");
const extractJSON = (raw) => {
    const text = raw.trim();
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch)
        return codeBlockMatch[1].trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch)
        return jsonMatch[0];
    return text;
};
const screenResume = async (resumeText, jobTitle, jobDescription, requirements, skills) => {
    const prompt = `You are an expert technical recruiter. Carefully analyze the resume below against the job requirements and return a JSON assessment.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription.slice(0, 800)}

REQUIRED SKILLS: ${skills.join(', ')}

REQUIREMENTS:
${requirements
        .slice(0, 5)
        .map((r, i) => `${i + 1}. ${r}`)
        .join('\n')}

RESUME TEXT:
${resumeText.slice(0, 3500)}

Return ONLY a JSON object with these exact fields:
- score: integer from 0 to 100 representing how well the candidate matches
- summary: string, 2-3 sentences about candidate fit
- strengths: array of 2-3 strings listing matching strengths
- weaknesses: array of 1-2 strings listing gaps

Example output:
{
  "score": 78,
  "summary": "Strong Node.js developer with 3 years experience. Good match for backend requirements.",
  "strengths": ["Node.js expertise", "React experience", "PostgreSQL knowledge"],
  "weaknesses": ["Limited cloud experience", "No Kafka mentioned"]
}`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(prompt);
        const raw = result.response.text();
        logger_1.logger.debug(`Gemini screening raw response: ${raw.slice(0, 200)}`);
        const cleaned = extractJSON(raw);
        const parsed = JSON.parse(cleaned);
        const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
        const summary = typeof parsed.summary === 'string'
            ? parsed.summary
            : 'No summary available';
        const strengths = Array.isArray(parsed.strengths)
            ? parsed.strengths.filter((s) => typeof s === 'string')
            : [];
        const weaknesses = Array.isArray(parsed.weaknesses)
            ? parsed.weaknesses.filter((w) => typeof w === 'string')
            : [];
        return { score, summary, strengths, weaknesses };
    }
    catch (err) {
        logger_1.logger.error('AI screening failed with error:', err);
        logger_1.logger.error('This is usually a JSON parsing issue with Gemini response');
        return {
            score: 50,
            summary: 'AI screening completed with limited analysis. Manual review recommended.',
            strengths: ['Resume submitted successfully'],
            weaknesses: ['Automated screening encountered an issue'],
        };
    }
};
exports.screenResume = screenResume;
const generatePersonalizedEmail = async (type, candidateName, jobTitle, companyName, aiSummary) => {
    const prompt = `Write a professional ${type === 'shortlisted' ? 'shortlisting' : 'rejection'} email.

Candidate name: ${candidateName}
Job title: ${jobTitle}
Company: ${companyName}
${aiSummary ? `Candidate assessment: ${aiSummary}` : ''}

Return ONLY a JSON object with these fields:
- subject: the email subject line
- body: the email body text (3-4 short paragraphs, plain text, no HTML)

Example:
{
  "subject": "Your application for Full Stack Developer - Update",
  "body": "Dear John,\\n\\nThank you for applying..."
}`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(prompt);
        const cleaned = extractJSON(result.response.text());
        return JSON.parse(cleaned);
    }
    catch (err) {
        logger_1.logger.error('Email generation failed:', err);
        if (type === 'shortlisted') {
            return {
                subject: `Great news — You've been shortlisted for ${jobTitle}`,
                body: `Dear ${candidateName},\n\nCongratulations! We're pleased to inform you that you have been shortlisted for the ${jobTitle} position at ${companyName}.\n\nOur team was impressed with your profile and would like to move forward. We will be in touch shortly with the next steps.\n\nBest regards,\n${companyName} Hiring Team`,
            };
        }
        return {
            subject: `Update on your ${jobTitle} application`,
            body: `Dear ${candidateName},\n\nThank you for your interest in the ${jobTitle} role at ${companyName} and for taking the time to apply.\n\nAfter careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current requirements.\n\nWe appreciate your time and wish you the best in your job search.\n\nBest regards,\n${companyName} Hiring Team`,
        };
    }
};
exports.generatePersonalizedEmail = generatePersonalizedEmail;
const chatWithCandidatePool = async (query, candidates) => {
    const candidateList = candidates
        .map((c, i) => `${i + 1}. ${c.name} | Score: ${c.score}/100 | Skills: ${c.skills.join(', ')} | Summary: ${c.summary}`)
        .join('\n');
    const prompt = `You are an AI recruiter assistant. Answer recruiter questions based ONLY on the candidate list below. Be specific, mention names, and be concise.

CANDIDATE POOL:
${candidateList}

RECRUITER QUESTION: ${query}`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch (err) {
        logger_1.logger.error('Candidate pool chat failed:', err);
        return 'Unable to process your question right now. Please try again.';
    }
};
exports.chatWithCandidatePool = chatWithCandidatePool;
const buildResumeFromScratch = async (userInput) => {
    const prompt = `You are a professional resume writer. Create a complete, impressive resume for the candidate below.

CANDIDATE DETAILS:
Name: ${userInput.name}
Email: ${userInput.email}
Phone: ${userInput.phone}
Location: ${userInput.location}
Target Role: ${userInput.targetRole}
Years of Experience: ${userInput.yearsOfExperience}
Skills: ${userInput.skills}
Education: ${userInput.education}
Previous Roles: ${userInput.previousRoles || 'Not provided — create plausible experience based on skills and target role'}

Return ONLY a JSON object with this structure:
{
  "personalInfo": {
    "fullName": "${userInput.name}",
    "email": "${userInput.email}",
    "phone": "${userInput.phone}",
    "location": "${userInput.location}",
    "linkedinUrl": "",
    "githubUrl": ""
  },
  "summary": "Write a strong 2-3 sentence professional summary targeting ${userInput.targetRole}",
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Jan 2023 - Present",
      "responsibilities": ["Action verb + achievement bullet", "Another bullet"]
    }
  ],
  "education": [
    {
      "institution": "College/University Name",
      "degree": "Degree Name",
      "year": "2024"
    }
  ],
  "skills": ["Skill1", "Skill2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does and your contribution",
      "techStack": ["Tech1", "Tech2"],
      "link": ""
    }
  ],
  "certifications": []
}`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(prompt);
        const cleaned = extractJSON(result.response.text());
        return JSON.parse(cleaned);
    }
    catch (err) {
        logger_1.logger.error('Resume build from scratch failed:', err);
        throw new Error('Failed to generate resume. Please try again.');
    }
};
exports.buildResumeFromScratch = buildResumeFromScratch;
const buildResumeFromUpload = async (parsedResumeText, targetRole) => {
    const prompt = `You are a professional resume writer. Parse and significantly enhance this resume${targetRole ? ` to target a ${targetRole} role` : ''}.

ORIGINAL RESUME TEXT:
${parsedResumeText.slice(0, 5000)}

Extract all information accurately and enhance:
- Make bullet points action-oriented (start with strong verbs)
- Quantify achievements where possible
- Improve the professional summary
- Keep all real information — do not fabricate new roles or companies

Return ONLY a JSON object with this exact structure:
{
  "personalInfo": {
    "fullName": "extracted name",
    "email": "extracted email",
    "phone": "extracted phone",
    "location": "extracted location",
    "linkedinUrl": "if found",
    "githubUrl": "if found",
    "portfolioUrl": "if found"
  },
  "summary": "Enhanced 2-3 sentence professional summary",
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Duration",
      "responsibilities": ["Enhanced bullet 1", "Enhanced bullet 2"]
    }
  ],
  "education": [
    {
      "institution": "Institution Name",
      "degree": "Degree",
      "year": "Year"
    }
  ],
  "skills": ["skill1", "skill2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Description",
      "techStack": ["Tech1"],
      "link": ""
    }
  ],
  "certifications": []
}`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(prompt);
        const cleaned = extractJSON(result.response.text());
        return JSON.parse(cleaned);
    }
    catch (err) {
        logger_1.logger.error('Resume build from upload failed:', err);
        throw new Error('Failed to parse and enhance resume. Please try again.');
    }
};
exports.buildResumeFromUpload = buildResumeFromUpload;
const aiJobSearch = async (query, jobs) => {
    const jobList = jobs
        .map((j, i) => `${i + 1}. ID:${j.id} | ${j.title} at ${j.company || 'Unknown'} | Skills: ${j.skills.join(', ')} | ${j.isRemote ? 'Remote' : j.location || 'On-site'}`)
        .join('\n');
    const prompt = `You are an AI job search assistant. Match the candidate's query to the most relevant jobs.

CANDIDATE QUERY: "${query}"

AVAILABLE JOBS:
${jobList}

Return ONLY a JSON object:
{
  "matches": [
    {"id": "<job id>", "relevanceScore": <0-100>, "reason": "<1 sentence why this matches>"}
  ],
  "suggestion": "<1 sentence tip to improve their search or profile>"
}

Include only jobs with relevanceScore >= 40. Sort by score descending. Max 5 matches.`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(prompt);
        const cleaned = extractJSON(result.response.text());
        return JSON.parse(cleaned);
    }
    catch (err) {
        logger_1.logger.error('AI job search failed:', err);
        return {
            matches: [],
            suggestion: 'Try searching with specific skills like "Node.js developer" or "React frontend".',
        };
    }
};
exports.aiJobSearch = aiJobSearch;
const enhanceResumeSection = async (section, currentValue, prompt) => {
    const p = `You are an expert resume writer. Enhance the ${section} section of a resume.

CURRENT CONTENT:
${currentValue || '(empty)'}

USER INSTRUCTION: ${prompt}

Rewrite and improve this section based on the instruction. Return ONLY the enhanced text, no JSON, no explanation, no markdown formatting. Use bullet points starting with • for lists.`;
    try {
        const model = (0, gemini_1.getModel)();
        const result = await model.generateContent(p);
        return result.response.text().trim();
    }
    catch (err) {
        logger_1.logger.error('Section enhance failed:', err);
        return currentValue;
    }
};
exports.enhanceResumeSection = enhanceResumeSection;
//# sourceMappingURL=ai.service.js.map