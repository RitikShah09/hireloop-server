'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.getCandidateFullProfile =
  exports.getSuggestedJobs =
  exports.deleteMilestone =
  exports.updateMilestone =
  exports.addMilestone =
  exports.getMilestones =
  exports.deleteEducation =
  exports.updateEducation =
  exports.addEducation =
  exports.getEducations =
  exports.deleteWorkExperience =
  exports.updateWorkExperience =
  exports.addWorkExperience =
  exports.getWorkExperiences =
  exports.deleteCertification =
  exports.updateCertification =
  exports.addCertification =
  exports.getCertifications =
    void 0;
const prisma_1 = __importDefault(require('../config/prisma'));
const errors_1 = require('../utils/errors');
const getCertifications = async (candidateId) => {
  return prisma_1.default.certification.findMany({
    where: { candidateId },
    orderBy: { issueDate: 'desc' },
  });
};
exports.getCertifications = getCertifications;
const addCertification = async (candidateId, data) => {
  return prisma_1.default.certification.create({
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
exports.addCertification = addCertification;
const updateCertification = async (candidateId, certId, data) => {
  const cert = await prisma_1.default.certification.findFirst({
    where: { id: certId, candidateId },
  });
  if (!cert) throw new errors_1.AppError('Certification not found', 404);
  return prisma_1.default.certification.update({
    where: { id: certId },
    data: {
      ...data,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    },
  });
};
exports.updateCertification = updateCertification;
const deleteCertification = async (candidateId, certId) => {
  const cert = await prisma_1.default.certification.findFirst({
    where: { id: certId, candidateId },
  });
  if (!cert) throw new errors_1.AppError('Certification not found', 404);
  await prisma_1.default.certification.delete({ where: { id: certId } });
};
exports.deleteCertification = deleteCertification;
const getWorkExperiences = async (candidateId) => {
  return prisma_1.default.workExperience.findMany({
    where: { candidateId },
    orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
  });
};
exports.getWorkExperiences = getWorkExperiences;
const addWorkExperience = async (candidateId, data) => {
  return prisma_1.default.workExperience.create({
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
exports.addWorkExperience = addWorkExperience;
const updateWorkExperience = async (candidateId, expId, data) => {
  const exp = await prisma_1.default.workExperience.findFirst({
    where: { id: expId, candidateId },
  });
  if (!exp) throw new errors_1.AppError('Work experience not found', 404);
  return prisma_1.default.workExperience.update({
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
exports.updateWorkExperience = updateWorkExperience;
const deleteWorkExperience = async (candidateId, expId) => {
  const exp = await prisma_1.default.workExperience.findFirst({
    where: { id: expId, candidateId },
  });
  if (!exp) throw new errors_1.AppError('Work experience not found', 404);
  await prisma_1.default.workExperience.delete({ where: { id: expId } });
};
exports.deleteWorkExperience = deleteWorkExperience;
const getEducations = async (candidateId) => {
  return prisma_1.default.education.findMany({
    where: { candidateId },
    orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
  });
};
exports.getEducations = getEducations;
const addEducation = async (candidateId, data) => {
  return prisma_1.default.education.create({
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
exports.addEducation = addEducation;
const updateEducation = async (candidateId, eduId, data) => {
  const edu = await prisma_1.default.education.findFirst({
    where: { id: eduId, candidateId },
  });
  if (!edu) throw new errors_1.AppError('Education not found', 404);
  return prisma_1.default.education.update({
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
exports.updateEducation = updateEducation;
const deleteEducation = async (candidateId, eduId) => {
  const edu = await prisma_1.default.education.findFirst({
    where: { id: eduId, candidateId },
  });
  if (!edu) throw new errors_1.AppError('Education not found', 404);
  await prisma_1.default.education.delete({ where: { id: eduId } });
};
exports.deleteEducation = deleteEducation;
const getMilestones = async (candidateId) => {
  return prisma_1.default.milestone.findMany({
    where: { candidateId },
    orderBy: { date: 'desc' },
  });
};
exports.getMilestones = getMilestones;
const addMilestone = async (candidateId, data) => {
  return prisma_1.default.milestone.create({
    data: {
      candidateId,
      title: data.title,
      description: data.description,
      date: new Date(data.date),
    },
  });
};
exports.addMilestone = addMilestone;
const updateMilestone = async (candidateId, milestoneId, data) => {
  const milestone = await prisma_1.default.milestone.findFirst({
    where: { id: milestoneId, candidateId },
  });
  if (!milestone) throw new errors_1.AppError('Milestone not found', 404);
  return prisma_1.default.milestone.update({
    where: { id: milestoneId },
    data: { ...data, date: data.date ? new Date(data.date) : undefined },
  });
};
exports.updateMilestone = updateMilestone;
const deleteMilestone = async (candidateId, milestoneId) => {
  const milestone = await prisma_1.default.milestone.findFirst({
    where: { id: milestoneId, candidateId },
  });
  if (!milestone) throw new errors_1.AppError('Milestone not found', 404);
  await prisma_1.default.milestone.delete({ where: { id: milestoneId } });
};
exports.deleteMilestone = deleteMilestone;
const getSuggestedJobs = async (candidateId) => {
  const candidate = await prisma_1.default.candidate.findUnique({
    where: { id: candidateId },
    select: { skills: true },
  });
  if (!candidate || candidate.skills.length === 0) {
    return prisma_1.default.job.findMany({
      where: { status: 'ACTIVE' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true, logoUrl: true, industry: true } },
        _count: { select: { applications: true } },
      },
    });
  }
  const jobs = await prisma_1.default.job.findMany({
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
exports.getSuggestedJobs = getSuggestedJobs;
const getCandidateFullProfile = async (candidateId) => {
  return prisma_1.default.candidate.findUnique({
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
exports.getCandidateFullProfile = getCandidateFullProfile;
//# sourceMappingURL=candidate.service.js.map
