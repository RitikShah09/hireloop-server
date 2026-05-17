'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.deleteFile =
  exports.uploadCandidateAvatar =
  exports.uploadCompanyLogo =
  exports.uploadResume =
    void 0;
const imagekit_1 = require('../config/imagekit');
const errors_1 = require('../utils/errors');
const uploadResume = async (buffer, fileName, candidateId) => {
  try {
    const result = await imagekit_1.imagekit.upload({
      file: buffer,
      fileName: `${candidateId}-${Date.now()}-${fileName}`,
      folder: imagekit_1.IMAGEKIT_FOLDERS.RESUMES,
      useUniqueFileName: false,
    });
    return { url: result.url, fileId: result.fileId, name: result.name };
  } catch (err) {
    throw new errors_1.AppError('Failed to upload resume', 500);
  }
};
exports.uploadResume = uploadResume;
const uploadCompanyLogo = async (buffer, fileName, companyId) => {
  try {
    const result = await imagekit_1.imagekit.upload({
      file: buffer,
      fileName: `${companyId}-logo-${Date.now()}`,
      folder: imagekit_1.IMAGEKIT_FOLDERS.COMPANY_LOGOS,
      useUniqueFileName: false,
    });
    return { url: result.url, fileId: result.fileId, name: result.name };
  } catch {
    throw new errors_1.AppError('Failed to upload company logo', 500);
  }
};
exports.uploadCompanyLogo = uploadCompanyLogo;
const uploadCandidateAvatar = async (buffer, fileName, candidateId) => {
  try {
    const result = await imagekit_1.imagekit.upload({
      file: buffer,
      fileName: `${candidateId}-avatar-${Date.now()}`,
      folder: imagekit_1.IMAGEKIT_FOLDERS.CANDIDATE_AVATARS,
      useUniqueFileName: false,
    });
    return { url: result.url, fileId: result.fileId, name: result.name };
  } catch {
    throw new errors_1.AppError('Failed to upload avatar', 500);
  }
};
exports.uploadCandidateAvatar = uploadCandidateAvatar;
const deleteFile = async (fileId) => {
  try {
    await imagekit_1.imagekit.deleteFile(fileId);
  } catch {
    console.error('Failed to delete file from ImageKit:', fileId);
  }
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=imagekit.service.js.map
