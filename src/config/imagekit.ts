import ImageKit from 'imagekit';
import { env } from './env';

export const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

export const IMAGEKIT_FOLDERS = {
  RESUMES: '/hireloop/resumes',
  COMPANY_LOGOS: '/hireloop/companies',
  CANDIDATE_AVATARS: '/hireloop/candidates',
};
