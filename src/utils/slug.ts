import { v4 as uuidv4 } from 'uuid';

export const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const suffix = uuidv4().split('-')[0];
  return `${base}-${suffix}`;
};
