export declare const sendEmail: (
  to: string,
  subject: string,
  html: string,
  applicationId?: string,
  type?: string
) => Promise<void>;
export declare const sendApplicationEmail: (
  to: string,
  subject: string,
  body: string,
  applicationId: string,
  type: string
) => Promise<void>;
export declare const sendApplicationReceivedEmail: (opts: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  applicationId: string;
}) => Promise<void>;
export declare const sendNewApplicationAlertEmail: (opts: {
  companyEmail: string;
  companyName: string;
  candidateName: string;
  jobTitle: string;
  applicationId: string;
  appliedAt: string;
}) => Promise<void>;
export declare const sendScreeningCompleteEmail: (opts: {
  companyEmail: string;
  candidateName: string;
  jobTitle: string;
  aiScore: number;
  aiSummary: string;
  applicationId: string;
}) => Promise<void>;
//# sourceMappingURL=email.service.d.ts.map
