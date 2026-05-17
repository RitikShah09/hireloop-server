export declare const getCertifications: (candidateId: string) => Promise<
  {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    candidateId: string;
    issuer: string;
    issueDate: Date | null;
    expiryDate: Date | null;
    credentialId: string | null;
    credentialUrl: string | null;
  }[]
>;
export declare const addCertification: (
  candidateId: string,
  data: {
    name: string;
    issuer: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }
) => Promise<{
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  candidateId: string;
  issuer: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  credentialId: string | null;
  credentialUrl: string | null;
}>;
export declare const updateCertification: (
  candidateId: string,
  certId: string,
  data: Partial<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    credentialId: string;
    credentialUrl: string;
  }>
) => Promise<{
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  candidateId: string;
  issuer: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  credentialId: string | null;
  credentialUrl: string | null;
}>;
export declare const deleteCertification: (
  candidateId: string,
  certId: string
) => Promise<void>;
export declare const getWorkExperiences: (candidateId: string) => Promise<
  {
    role: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    company: string;
    description: string | null;
    location: string | null;
    candidateId: string;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
  }[]
>;
export declare const addWorkExperience: (
  candidateId: string,
  data: {
    company: string;
    role: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }
) => Promise<{
  role: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  company: string;
  description: string | null;
  location: string | null;
  candidateId: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
}>;
export declare const updateWorkExperience: (
  candidateId: string,
  expId: string,
  data: Partial<{
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
  }>
) => Promise<{
  role: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  company: string;
  description: string | null;
  location: string | null;
  candidateId: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
}>;
export declare const deleteWorkExperience: (
  candidateId: string,
  expId: string
) => Promise<void>;
export declare const getEducations: (candidateId: string) => Promise<
  {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    candidateId: string;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
    institution: string;
    degree: string;
    field: string | null;
    grade: string | null;
  }[]
>;
export declare const addEducation: (
  candidateId: string,
  data: {
    institution: string;
    degree: string;
    field?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    grade?: string;
    description?: string;
  }
) => Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  candidateId: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  institution: string;
  degree: string;
  field: string | null;
  grade: string | null;
}>;
export declare const updateEducation: (
  candidateId: string,
  eduId: string,
  data: Partial<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    grade: string;
    description: string;
  }>
) => Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  candidateId: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  institution: string;
  degree: string;
  field: string | null;
  grade: string | null;
}>;
export declare const deleteEducation: (
  candidateId: string,
  eduId: string
) => Promise<void>;
export declare const getMilestones: (candidateId: string) => Promise<
  {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string | null;
    date: Date;
    candidateId: string;
  }[]
>;
export declare const addMilestone: (
  candidateId: string,
  data: {
    title: string;
    description?: string;
    date: string;
  }
) => Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string | null;
  date: Date;
  candidateId: string;
}>;
export declare const updateMilestone: (
  candidateId: string,
  milestoneId: string,
  data: Partial<{
    title: string;
    description: string;
    date: string;
  }>
) => Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string | null;
  date: Date;
  candidateId: string;
}>;
export declare const deleteMilestone: (
  candidateId: string,
  milestoneId: string
) => Promise<void>;
export declare const getSuggestedJobs: (candidateId: string) => Promise<
  ({
    company: {
      name: string;
      logoUrl: string | null;
      industry: string | null;
    };
    _count: {
      applications: number;
    };
  } & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    location: string | null;
    companyId: string;
    requirements: string[];
    skills: string[];
    isRemote: boolean;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    experienceMin: number | null;
    experienceMax: number | null;
    status: import('@prisma/client').$Enums.JobStatus;
    shareableSlug: string;
    closingDate: Date | null;
  })[]
>;
export declare const getCandidateFullProfile: (candidateId: string) => Promise<
  | ({
      certifications: {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        candidateId: string;
        issuer: string;
        issueDate: Date | null;
        expiryDate: Date | null;
        credentialId: string | null;
        credentialUrl: string | null;
      }[];
      workExperiences: {
        role: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        company: string;
        description: string | null;
        location: string | null;
        candidateId: string;
        startDate: Date;
        endDate: Date | null;
        isCurrent: boolean;
      }[];
      educations: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        candidateId: string;
        startDate: Date;
        endDate: Date | null;
        isCurrent: boolean;
        institution: string;
        degree: string;
        field: string | null;
        grade: string | null;
      }[];
      milestones: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        date: Date;
        candidateId: string;
      }[];
    } & {
      userId: string;
      id: string;
      createdAt: Date;
      updatedAt: Date;
      location: string | null;
      skills: string[];
      firstName: string;
      lastName: string;
      phone: string | null;
      bio: string | null;
      avatarUrl: string | null;
      avatarFileId: string | null;
      linkedinUrl: string | null;
      githubUrl: string | null;
      portfolioUrl: string | null;
    })
  | null
>;
//# sourceMappingURL=candidate.service.d.ts.map
