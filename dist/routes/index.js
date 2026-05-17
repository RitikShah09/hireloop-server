'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const auth_middleware_1 = require('../middlewares/auth.middleware');
const rateLimiter_middleware_1 = require('../middlewares/rateLimiter.middleware');
const upload_middleware_1 = require('../middlewares/upload.middleware');
const authController = __importStar(require('../controllers/auth.controller'));
const jobController = __importStar(require('../controllers/job.controller'));
const applicationController = __importStar(
  require('../controllers/application.controller')
);
const resumeController = __importStar(
  require('../controllers/resume.controller')
);
const profileController = __importStar(
  require('../controllers/profile.controller')
);
const resumeBuilderController = __importStar(
  require('../controllers/resumeBuilder.controller')
);
const searchController = __importStar(
  require('../controllers/search.controller')
);
const verificationController = __importStar(
  require('../controllers/verification.controller')
);
const analyticsController = __importStar(
  require('../controllers/analytics.controller')
);
const interviewController = __importStar(
  require('../controllers/interview.controller')
);
const aiSearchController = __importStar(
  require('../controllers/aiSearch.controller')
);
const sectionEnhanceController = __importStar(
  require('../controllers/sectionEnhance.controller')
);
const notificationController = __importStar(
  require('../controllers/notification.controller')
);
const candidateController = __importStar(
  require('../controllers/candidate.controller')
);
const router = (0, express_1.Router)();
const auth = (0, express_1.Router)();
auth.post(
  '/register',
  rateLimiter_middleware_1.authLimiter,
  authController.register
);
auth.post('/login', rateLimiter_middleware_1.authLimiter, authController.login);
auth.post('/refresh', authController.refresh);
auth.post('/logout', auth_middleware_1.authenticate, authController.logout);
auth.get(
  '/sessions',
  auth_middleware_1.authenticate,
  authController.getSessions
);
auth.delete(
  '/sessions/:sessionId',
  auth_middleware_1.authenticate,
  authController.revokeSession
);
auth.get('/me', auth_middleware_1.authenticate, authController.me);
auth.post(
  '/change-password',
  auth_middleware_1.authenticate,
  authController.changePassword
);
auth.post(
  '/send-otp',
  auth_middleware_1.authenticate,
  verificationController.sendOtp
);
auth.post(
  '/verify-email',
  auth_middleware_1.authenticate,
  verificationController.verifyEmail
);
auth.post(
  '/forgot-password',
  rateLimiter_middleware_1.authLimiter,
  verificationController.forgotPassword
);
auth.post(
  '/reset-password',
  rateLimiter_middleware_1.authLimiter,
  verificationController.resetPassword
);
const notifications = (0, express_1.Router)();
notifications.get(
  '/stream',
  auth_middleware_1.authenticate,
  notificationController.streamNotifications
);
notifications.get(
  '/',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  notificationController.getNotifications
);
notifications.get(
  '/unread-count',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  notificationController.getUnreadCount
);
notifications.patch(
  '/:id/read',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  notificationController.markAsRead
);
notifications.patch(
  '/mark-all-read',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  notificationController.markAllAsRead
);
notifications.delete(
  '/read',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  notificationController.deleteReadNotifications
);
notifications.delete(
  '/:id',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  notificationController.deleteNotification
);
const jobs = (0, express_1.Router)();
jobs.get('/', jobController.listJobs);
jobs.get('/slug/:slug', jobController.getJobBySlug);
jobs.get(
  '/mine',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  jobController.getCompanyJobs
);
jobs.post(
  '/ai-search',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.aiLimiter,
  aiSearchController.aiSearchJobs
);
jobs.post(
  '/',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  jobController.createJob
);
jobs.get('/:id', jobController.getJob);
jobs.patch(
  '/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  jobController.updateJob
);
jobs.delete(
  '/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  jobController.deleteJob
);
const applications = (0, express_1.Router)();
applications.post(
  '/',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  applicationController.applyToJob
);
applications.get(
  '/',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  applicationController.getApplications
);
applications.get(
  '/stats',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  applicationController.getApplicationStats
);
applications.patch(
  '/:id/status',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  applicationController.updateApplicationStatus
);
applications.post(
  '/chat',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.aiLimiter,
  applicationController.chatWithPool
);
applications.get(
  '/semantic/:jobId',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.aiLimiter,
  applicationController.semanticSearch
);
applications.post(
  '/ai-search',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.aiLimiter,
  applicationController.aiJobSearch
);
const resumes = (0, express_1.Router)();
resumes.post(
  '/upload',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  upload_middleware_1.uploadResume.single('resume'),
  resumeController.uploadResume
);
resumes.get(
  '/',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  resumeController.getResumes
);
resumes.delete(
  '/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  resumeController.deleteResume
);
resumes.patch(
  '/:id/default',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  resumeController.setDefaultResume
);
const profiles = (0, express_1.Router)();
profiles.get(
  '/candidate',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  profileController.getCandidateProfile
);
profiles.patch(
  '/candidate',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  profileController.updateCandidateProfile
);
profiles.post(
  '/candidate/avatar',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  upload_middleware_1.uploadImage.single('avatar'),
  profileController.uploadCandidateAvatar
);
profiles.get(
  '/company',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  profileController.getCompanyProfile
);
profiles.patch(
  '/company',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  profileController.updateCompanyProfile
);
profiles.post(
  '/company/logo',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  upload_middleware_1.uploadImage.single('logo'),
  profileController.uploadCompanyLogo
);
profiles.get('/company/:id/public', profileController.getPublicCompanyProfile);
const candidate = (0, express_1.Router)();
candidate.get(
  '/full-profile',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  candidateController.getFullProfile
);
candidate.get(
  '/suggested-jobs',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.getSuggestedJobs
);
candidate.get(
  '/certifications',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  candidateController.getCertifications
);
candidate.post(
  '/certifications',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.addCertification
);
candidate.patch(
  '/certifications/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.updateCertification
);
candidate.delete(
  '/certifications/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.deleteCertification
);
candidate.get(
  '/experience',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  candidateController.getWorkExperiences
);
candidate.post(
  '/experience',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.addWorkExperience
);
candidate.patch(
  '/experience/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.updateWorkExperience
);
candidate.delete(
  '/experience/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.deleteWorkExperience
);
candidate.get(
  '/education',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  candidateController.getEducations
);
candidate.post(
  '/education',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.addEducation
);
candidate.patch(
  '/education/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.updateEducation
);
candidate.delete(
  '/education/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.deleteEducation
);
candidate.get(
  '/milestones',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  candidateController.getMilestones
);
candidate.post(
  '/milestones',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.addMilestone
);
candidate.patch(
  '/milestones/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.updateMilestone
);
candidate.delete(
  '/milestones/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
  candidateController.deleteMilestone
);
const resumeBuilder = (0, express_1.Router)();
resumeBuilder.post(
  '/from-scratch',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.aiLimiter,
  resumeBuilderController.buildFromScratch
);
resumeBuilder.post(
  '/from-upload',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.aiLimiter,
  upload_middleware_1.uploadResume.single('resume'),
  resumeBuilderController.buildFromUpload
);
resumeBuilder.post(
  '/from-existing/:resumeId',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.aiLimiter,
  resumeBuilderController.buildFromExistingResume
);
resumeBuilder.post(
  '/enhance-section',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.aiLimiter,
  sectionEnhanceController.enhanceSection
);
const search = (0, express_1.Router)();
search.get(
  '/candidates',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  searchController.searchCandidates
);
search.get(
  '/candidates/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  searchController.getCandidateById
);
search.get(
  '/companies',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  searchController.searchCompanies
);
search.get(
  '/companies/:id',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  searchController.getCompanyById
);
const analytics = (0, express_1.Router)();
analytics.get(
  '/company',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  analyticsController.getCompanyAnalytics
);
const interviews = (0, express_1.Router)();
interviews.post(
  '/',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  interviewController.scheduleInterview
);
interviews.get(
  '/',
  auth_middleware_1.authenticate,
  rateLimiter_middleware_1.userLimiter,
  interviewController.getInterviews
);
interviews.patch(
  '/:id',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('COMPANY'),
  rateLimiter_middleware_1.userLimiter,
  interviewController.updateInterview
);
interviews.patch(
  '/:id/respond',
  auth_middleware_1.authenticate,
  (0, auth_middleware_1.authorize)('CANDIDATE'),
  rateLimiter_middleware_1.userLimiter,
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
exports.default = router;
//# sourceMappingURL=index.js.map
