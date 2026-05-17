import { imagekit, IMAGEKIT_FOLDERS } from '../config/imagekit';
import { AppError } from '../utils/errors';

interface UploadResult {
  url: string;
  fileId: string;
  name: string;
}

export const uploadResume = async (
  buffer: Buffer,
  fileName: string,
  candidateId: string
): Promise<UploadResult> => {
  try {
    const result = await imagekit.upload({
      file: buffer,
      fileName: `${candidateId}-${Date.now()}-${fileName}`,
      folder: IMAGEKIT_FOLDERS.RESUMES,
      useUniqueFileName: false,
    });
    return { url: result.url, fileId: result.fileId, name: result.name };
  } catch (err) {
    throw new AppError('Failed to upload resume', 500);
  }
};

export const uploadCompanyLogo = async (
  buffer: Buffer,
  fileName: string,
  companyId: string
): Promise<UploadResult> => {
  try {
    const result = await imagekit.upload({
      file: buffer,
      fileName: `${companyId}-logo-${Date.now()}`,
      folder: IMAGEKIT_FOLDERS.COMPANY_LOGOS,
      useUniqueFileName: false,
    });
    return { url: result.url, fileId: result.fileId, name: result.name };
  } catch {
    throw new AppError('Failed to upload company logo', 500);
  }
};

export const uploadCandidateAvatar = async (
  buffer: Buffer,
  fileName: string,
  candidateId: string
): Promise<UploadResult> => {
  try {
    const result = await imagekit.upload({
      file: buffer,
      fileName: `${candidateId}-avatar-${Date.now()}`,
      folder: IMAGEKIT_FOLDERS.CANDIDATE_AVATARS,
      useUniqueFileName: false,
    });
    return { url: result.url, fileId: result.fileId, name: result.name };
  } catch {
    throw new AppError('Failed to upload avatar', 500);
  }
};

export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    await imagekit.deleteFile(fileId);
  } catch {
    console.error('Failed to delete file from ImageKit:', fileId);
  }
};
