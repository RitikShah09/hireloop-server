interface UploadResult {
  url: string;
  fileId: string;
  name: string;
}
export declare const uploadResume: (
  buffer: Buffer,
  fileName: string,
  candidateId: string
) => Promise<UploadResult>;
export declare const uploadCompanyLogo: (
  buffer: Buffer,
  fileName: string,
  companyId: string
) => Promise<UploadResult>;
export declare const uploadCandidateAvatar: (
  buffer: Buffer,
  fileName: string,
  candidateId: string
) => Promise<UploadResult>;
export declare const deleteFile: (fileId: string) => Promise<void>;
export {};
//# sourceMappingURL=imagekit.service.d.ts.map
