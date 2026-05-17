import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  authLimiter,
  userLimiter,
  aiLimiter,
} from '../middlewares/rateLimiter.middleware';
import {
  uploadResume as multerResume,
  uploadImage,
} from '../middlewares/upload.middleware';

import * as authController from '../controllers/auth.controller';
import * as jobController from '../controllers/job.controller';
import * as applicationController from '../controllers/application.controller';
import * as resumeController from '../controllers/resume.controller';
import * as profileController from '../controllers/profile.controller';
import * as resumeBuilderController from '../controllers/resumeBuilder.controller';
import * as searchController from '../controllers/search.controller';
import * as verificationController from '../controllers/verification.controller';
import * as analyticsController from '../controllers/analytics.controller';
import * as interviewController from '../controllers/interview.controller';
import * as aiSearchController from '../controllers/aiSearch.controller';
import * as sectionEnhanceController from '../controllers/sectionEnhance.controller';
import * as notificationController from '../controllers/notification.controller';
import * as candidateController from '../controllers/candidate.controller';

const router = Router();

const auth = Router();
auth.post('/register', authLimiter, authController.register);
auth.post('/login', authLimiter, authController.login);
auth.post('/refresh', authController.refresh);
auth.post('/logout', authenticate, authController.logout);
auth.get('/sessions', authenticate, authController.getSessions);
auth.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
auth.get('/me', authenticate, authController.me);
auth.post('/change-password', authenticate, authController.changePassword);
auth.post('/send-otp', authenticate, verificationController.sendOtp);
auth.post('/verify-email', authenticate, verificationController.verifyEmail);
auth.post(
  '/forgot-password',
  authLimiter,
  verificationController.forgotPassword
);
auth.post('/reset-password', authLimiter, verificationController.resetPassword);

const notifications = Router();
notifications.get(
  '/stream',
  authenticate,
  notificationController.streamNotifications
);
notifications.get(
  '/',
  authenticate,
  userLimiter,
  notificationController.getNotifications
);
notifications.get(
  '/unread-count',
  authenticate,
  userLimiter,
  notificationController.getUnreadCount
);
notifications.patch(
  '/:id/read',
  authenticate,
  userLimiter,
  notificationController.markAsRead
);
notifications.patch(
  '/mark-all-read',
  authenticate,
  userLimiter,
  notificationController.markAllAsRead
);
notifications.delete(
  '/read',
  authenticate,
  userLimiter,
  notificationController.deleteReadNotifications
);
notifications.delete(
  '/:id',
  authenticate,
  userLimiter,
  notificationController.deleteNotification
);

const jobs = Router();
jobs.get('/', jobController.listJobs);
jobs.get('/slug/:slug', jobController.getJobBySlug);
jobs.get(
  '/mine',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  jobController.getCompanyJobs
);
jobs.post(
  '/ai-search',
  authenticate,
  authorize('CANDIDATE'),
  aiLimiter,
  aiSearchController.aiSearchJobs
);
jobs.post(
  '/',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  jobController.createJob
);
jobs.get('/:id', jobController.getJob);
jobs.patch(
  '/:id',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  jobController.updateJob
);
jobs.delete(
  '/:id',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  jobController.deleteJob
);

const applications = Router();
applications.post(
  '/',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  applicationController.applyToJob
);
applications.get(
  '/',
  authenticate,
  userLimiter,
  applicationController.getApplications
);
applications.get(
  '/stats',
  authenticate,
  userLimiter,
  applicationController.getApplicationStats
);
applications.patch(
  '/:id/status',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  applicationController.updateApplicationStatus
);
applications.post(
  '/chat',
  authenticate,
  authorize('COMPANY'),
  aiLimiter,
  applicationController.chatWithPool
);
applications.get(
  '/semantic/:jobId',
  authenticate,
  authorize('COMPANY'),
  aiLimiter,
  applicationController.semanticSearch
);
applications.post(
  '/ai-search',
  authenticate,
  authorize('CANDIDATE'),
  aiLimiter,
  applicationController.aiJobSearch
);

const resumes = Router();
resumes.post(
  '/upload',
  authenticate,
  authorize('CANDIDATE'),
  multerResume.single('resume'),
  resumeController.uploadResume
);
resumes.get(
  '/',
  authenticate,
  authorize('CANDIDATE'),
  resumeController.getResumes
);
resumes.delete(
  '/:id',
  authenticate,
  authorize('CANDIDATE'),
  resumeController.deleteResume
);
resumes.patch(
  '/:id/default',
  authenticate,
  authorize('CANDIDATE'),
  resumeController.setDefaultResume
);

const profiles = Router();
profiles.get(
  '/candidate',
  authenticate,
  authorize('CANDIDATE'),
  profileController.getCandidateProfile
);
profiles.patch(
  '/candidate',
  authenticate,
  authorize('CANDIDATE'),
  profileController.updateCandidateProfile
);
profiles.post(
  '/candidate/avatar',
  authenticate,
  authorize('CANDIDATE'),
  uploadImage.single('avatar'),
  profileController.uploadCandidateAvatar
);
profiles.get(
  '/company',
  authenticate,
  authorize('COMPANY'),
  profileController.getCompanyProfile
);
profiles.patch(
  '/company',
  authenticate,
  authorize('COMPANY'),
  profileController.updateCompanyProfile
);
profiles.post(
  '/company/logo',
  authenticate,
  authorize('COMPANY'),
  uploadImage.single('logo'),
  profileController.uploadCompanyLogo
);
profiles.get('/company/:id/public', profileController.getPublicCompanyProfile);

const candidate = Router();
candidate.get(
  '/full-profile',
  authenticate,
  authorize('CANDIDATE'),
  candidateController.getFullProfile
);
candidate.get(
  '/suggested-jobs',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.getSuggestedJobs
);

candidate.get(
  '/certifications',
  authenticate,
  authorize('CANDIDATE'),
  candidateController.getCertifications
);
candidate.post(
  '/certifications',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.addCertification
);
candidate.patch(
  '/certifications/:id',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.updateCertification
);
candidate.delete(
  '/certifications/:id',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.deleteCertification
);

candidate.get(
  '/experience',
  authenticate,
  authorize('CANDIDATE'),
  candidateController.getWorkExperiences
);
candidate.post(
  '/experience',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.addWorkExperience
);
candidate.patch(
  '/experience/:id',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.updateWorkExperience
);
candidate.delete(
  '/experience/:id',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.deleteWorkExperience
);

candidate.get(
  '/education',
  authenticate,
  authorize('CANDIDATE'),
  candidateController.getEducations
);
candidate.post(
  '/education',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.addEducation
);
candidate.patch(
  '/education/:id',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.updateEducation
);
candidate.delete(
  '/education/:id',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.deleteEducation
);

candidate.get(
  '/milestones',
  authenticate,
  authorize('CANDIDATE'),
  candidateController.getMilestones
);
candidate.post(
  '/milestones',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.addMilestone
);
candidate.patch(
  '/milestones/:id',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.updateMilestone
);
candidate.delete(
  '/milestones/:id',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  candidateController.deleteMilestone
);

const resumeBuilder = Router();
resumeBuilder.post(
  '/from-scratch',
  authenticate,
  authorize('CANDIDATE'),
  aiLimiter,
  resumeBuilderController.buildFromScratch
);
resumeBuilder.post(
  '/from-upload',
  authenticate,
  authorize('CANDIDATE'),
  aiLimiter,
  multerResume.single('resume'),
  resumeBuilderController.buildFromUpload
);
resumeBuilder.post(
  '/from-existing/:resumeId',
  authenticate,
  authorize('CANDIDATE'),
  aiLimiter,
  resumeBuilderController.buildFromExistingResume
);
resumeBuilder.post(
  '/enhance-section',
  authenticate,
  authorize('CANDIDATE'),
  aiLimiter,
  sectionEnhanceController.enhanceSection
);

const search = Router();
search.get(
  '/candidates',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  searchController.searchCandidates
);
search.get(
  '/candidates/:id',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  searchController.getCandidateById
);
search.get(
  '/companies',
  authenticate,
  userLimiter,
  searchController.searchCompanies
);
search.get(
  '/companies/:id',
  authenticate,
  userLimiter,
  searchController.getCompanyById
);

const analytics = Router();
analytics.get(
  '/company',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  analyticsController.getCompanyAnalytics
);

const interviews = Router();
interviews.post(
  '/',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  interviewController.scheduleInterview
);
interviews.get(
  '/',
  authenticate,
  userLimiter,
  interviewController.getInterviews
);
interviews.patch(
  '/:id',
  authenticate,
  authorize('COMPANY'),
  userLimiter,
  interviewController.updateInterview
);
interviews.patch(
  '/:id/respond',
  authenticate,
  authorize('CANDIDATE'),
  userLimiter,
  interviewController.respondToInterview
);

router.use('/auth', auth);
router.use('/notifications', notifications);
router.use('/jobs', jobs);
router.use('/applications', applications);
router.use('/resumes', resumes);
router.use('/profiles', profiles);
router.use('/candidate', candidate);
router.use('/resume-builder', resumeBuilder);
router.use('/search', search);
router.use('/analytics', analytics);
router.use('/interviews', interviews);

export default router;
