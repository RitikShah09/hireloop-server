import prisma from '../config/prisma';
import { AppError } from '../utils/errors';

export const getCertifications = async (candidateId: string) => {
  return prisma.certification.findMany({
    where: { candidateId },
    orderBy: { issueDate: 'desc' },
  });
};

export const addCertification = async (
  candidateId: string,
  data: {
    name: string;
    issuer: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }
) => {
  return prisma.certification.create({
    data: {
      candidateId,
      name: data.name,
      issuer: data.issuer,
      issueDate: data.issueDate ? new Date(data.issueDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      credentialId: data.credentialId,
      credentialUrl: data.credentialUrl,
    },
  });
};

export const updateCertification = async (
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
) => {
  const cert = await prisma.certification.findFirst({
    where: { id: certId, candidateId },
  });
  if (!cert) throw new AppError('Certification not found', 404);

  return prisma.certification.update({
    where: { id: certId },
    data: {
      ...data,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    },
  });
};

export const deleteCertification = async (
  candidateId: string,
  certId: string
) => {
  const cert = await prisma.certification.findFirst({
    where: { id: certId, candidateId },
  });
  if (!cert) throw new AppError('Certification not found', 404);
  await prisma.certification.delete({ where: { id: certId } });
};

export const getWorkExperiences = async (candidateId: string) => {
  return prisma.workExperience.findMany({
    where: { candidateId },
    orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
  });
};

export const addWorkExperience = async (
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
) => {
  return prisma.workExperience.create({
    data: {
      candidateId,
      company: data.company,
      role: data.role,
      location: data.location,
      startDate: new Date(data.startDate),
      endDate: data.isCurrent
        ? null
        : data.endDate
          ? new Date(data.endDate)
          : null,
      isCurrent: data.isCurrent ?? false,
      description: data.description,
    },
  });
};

export const updateWorkExperience = async (
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
) => {
  const exp = await prisma.workExperience.findFirst({
    where: { id: expId, candidateId },
  });
  if (!exp) throw new AppError('Work experience not found', 404);

  return prisma.workExperience.update({
    where: { id: expId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.isCurrent
        ? null
        : data.endDate
          ? new Date(data.endDate)
          : undefined,
    },
  });
};

export const deleteWorkExperience = async (
  candidateId: string,
  expId: string
) => {
  const exp = await prisma.workExperience.findFirst({
    where: { id: expId, candidateId },
  });
  if (!exp) throw new AppError('Work experience not found', 404);
  await prisma.workExperience.delete({ where: { id: expId } });
};

export const getEducations = async (candidateId: string) => {
  return prisma.education.findMany({
    where: { candidateId },
    orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
  });
};

export const addEducation = async (
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
) => {
  return prisma.education.create({
    data: {
      candidateId,
      institution: data.institution,
      degree: data.degree,
      field: data.field,
      startDate: new Date(data.startDate),
      endDate: data.isCurrent
        ? null
        : data.endDate
          ? new Date(data.endDate)
          : null,
      isCurrent: data.isCurrent ?? false,
      grade: data.grade,
      description: data.description,
    },
  });
};

export const updateEducation = async (
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
) => {
  const edu = await prisma.education.findFirst({
    where: { id: eduId, candidateId },
  });
  if (!edu) throw new AppError('Education not found', 404);

  return prisma.education.update({
    where: { id: eduId },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.isCurrent
        ? null
        : data.endDate
          ? new Date(data.endDate)
          : undefined,
    },
  });
};

export const deleteEducation = async (candidateId: string, eduId: string) => {
  const edu = await prisma.education.findFirst({
    where: { id: eduId, candidateId },
  });
  if (!edu) throw new AppError('Education not found', 404);
  await prisma.education.delete({ where: { id: eduId } });
};

export const getMilestones = async (candidateId: string) => {
  return prisma.milestone.findMany({
    where: { candidateId },
    orderBy: { date: 'desc' },
  });
};

export const addMilestone = async (
  candidateId: string,
  data: { title: string; description?: string; date: string }
) => {
  return prisma.milestone.create({
    data: {
      candidateId,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
    },
  });
};

export const updateMilestone = async (
  candidateId: string,
  milestoneId: string,
  data: Partial<{ title: string; description: string; date: string }>
) => {
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, candidateId },
  });
  if (!milestone) throw new AppError('Milestone not found', 404);

  return prisma.milestone.update({
    where: { id: milestoneId },
    data: { ...data, date: data.date ? new Date(data.date) : undefined },
  });
};

export const deleteMilestone = async (
  candidateId: string,
  milestoneId: string
) => {
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, candidateId },
  });
  if (!milestone) throw new AppError('Milestone not found', 404);
  await prisma.milestone.delete({ where: { id: milestoneId } });
};

export const getSuggestedJobs = async (candidateId: string) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { skills: true },
  });

  if (!candidate || candidate.skills.length === 0) {
    return prisma.job.findMany({
      where: { status: 'ACTIVE' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true, logoUrl: true, industry: true } },
        _count: { select: { applications: true } },
      },
    });
  }

  const jobs = await prisma.job.findMany({
    where: {
      status: 'ACTIVE',
      skills: { hasSome: candidate.skills },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { name: true, logoUrl: true, industry: true } },
      _count: { select: { applications: true } },
    },
  });

  const scored = jobs.map((job) => {
    const matches = job.skills.filter((s) =>
      candidate.skills.includes(s)
    ).length;
    return { ...job, matchScore: matches };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
};

export const getCandidateFullProfile = async (candidateId: string) => {
  return prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      certifications: { orderBy: { issueDate: 'desc' } },
      workExperiences: {
        orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
      },
      educations: { orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }] },
      milestones: { orderBy: { date: 'desc' } },
    },
  });
};
