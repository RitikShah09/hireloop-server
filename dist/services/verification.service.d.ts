export declare const sendEmailVerificationOtp: (
  userId: string,
  email: string
) => Promise<void>;
export declare const verifyEmailOtp: (
  userId: string,
  otp: string
) => Promise<void>;
export declare const sendPasswordResetOtp: (email: string) => Promise<void>;
export declare const resetPassword: (
  email: string,
  otp: string,
  newPassword: string
) => Promise<void>;
//# sourceMappingURL=verification.service.d.ts.map
