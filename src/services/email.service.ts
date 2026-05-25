import { sendMail } from '../config/mailer';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { logger } from '../config/logger';

const B = {
  primary: '#1d6af5',
  primaryDark: '#1259d4',
  primaryLight: '#eff5ff',
  success: '#16a34a',
  successLight: '#f0fdf4',
  warning: '#d97706',
  warningLight: '#fffbeb',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  bg: '#f7f8fc',
  surface: '#ffffff',
  surfaceRaised: '#f1f5f9',
  border: '#e4e8f0',
  text: '#0f1624',
  textMuted: '#5a6478',
  textSubtle: '#8e99b0',
};

const emailWrapper = (body: string, previewText = '') => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>HireLoop</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .email-body { padding: 24px 18px !important; }
      .email-footer { padding: 16px 18px !important; }
      .info-table td { display: block; width: 100% !important; padding: 6px 12px !important; }
      .info-table td:first-child { color: ${B.textSubtle}; padding-bottom: 0 !important; font-size: 11px !important; }
      .otp-block { padding: 20px 16px !important; }
      .otp-digits { font-size: 28px !important; letter-spacing: 8px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${B.bg};font-family:'Inter',Arial,Helvetica,sans-serif;">

  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${B.bg};padding:36px 16px;">
    <tr>
      <td align="center">

        <!-- Email container -->
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
          style="max-width:600px;border-radius:8px;overflow:hidden;border:1px solid ${B.border};box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${B.primary} 0%,${B.primaryDark} 100%);padding:22px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.18);border-radius:6px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:14px;font-weight:800;font-family:'Inter',Arial,sans-serif;line-height:32px;display:block;">H</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;font-family:'Inter',Arial,sans-serif;">
                      Hire<span style="opacity:0.8;">Loop</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent bar -->
          <tr>
            <td style="background:linear-gradient(90deg,${B.primary},${B.primaryDark});height:2px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="background-color:${B.surface};padding:36px 40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${B.surfaceRaised};border-top:1px solid ${B.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="email-footer" style="padding:18px 40px;text-align:center;">
                    <p style="margin:0 0 4px;color:${B.textSubtle};font-size:12px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">
                      This email was sent by <strong style="color:${B.textMuted};">HireLoop</strong>. Please do not reply to this message.
                    </p>
                    <p style="margin:0;color:${B.textSubtle};font-size:11px;font-family:'Inter',Arial,sans-serif;">
                      &copy; ${new Date().getFullYear()} HireLoop &nbsp;&bull;&nbsp; All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

const heading = (text: string) =>
  `<h2 style="margin:0 0 16px;color:${B.text};font-size:20px;font-weight:700;line-height:1.3;letter-spacing:-0.3px;font-family:'Inter',Arial,sans-serif;">${text}</h2>`;

const para = (text: string, muted = false) =>
  `<p style="margin:0 0 14px;color:${muted ? B.textMuted : B.text};font-size:15px;line-height:1.75;font-family:'Inter',Arial,sans-serif;">${text}</p>`;

const infoRow = (label: string, value: string) => `
  <tr>
    <td style="padding:10px 16px;color:${B.textMuted};font-size:12px;width:130px;vertical-align:top;white-space:nowrap;font-family:'Inter',Arial,sans-serif;border-bottom:1px solid ${B.border};">${label}</td>
    <td style="padding:10px 16px;color:${B.text};font-size:13px;font-weight:500;font-family:'Inter',Arial,sans-serif;border-bottom:1px solid ${B.border};">${value}</td>
  </tr>`;

const infoTable = (rows: string) => `
  <table class="info-table" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="border-radius:6px;border:1px solid ${B.border};overflow:hidden;margin:20px 0;">
    <tbody style="background:${B.surfaceRaised};">${rows}</tbody>
  </table>`;

const divider = () =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="border-top:1px solid ${B.border};"></td></tr></table>`;

const callout = (text: string, color = B.primary, bg = B.primaryLight) =>
  `<div style="background:${bg};border-left:3px solid ${color};border-radius:0 6px 6px 0;padding:14px 18px;margin:20px 0;">
    <p style="margin:0;color:${color};font-size:14px;line-height:1.7;font-family:'Inter',Arial,sans-serif;">${text}</p>
  </div>`;

const scoreChip = (score: number) => {
  const color = score >= 75 ? B.success : score >= 50 ? B.warning : B.danger;
  const bg =
    score >= 75 ? B.successLight : score >= 50 ? B.warningLight : B.dangerLight;
  return `<span style="display:inline-block;padding:3px 12px;border-radius:99px;background:${bg};color:${color};font-weight:700;font-size:14px;font-family:'Inter',Arial,sans-serif;">${score}/100</span>`;
};

const badge = (text: string, color = B.primary, bg = B.primaryLight) =>
  `<span style="display:inline-block;padding:3px 10px;border-radius:99px;background:${bg};color:${color};font-size:12px;font-weight:600;font-family:'Inter',Arial,sans-serif;">${text}</span>`;

const OTP_EXPIRY_MINUTES = 15;

export const otpEmailTemplate = (opts: {
  title: string;
  subtitle: string;
  otp: string;
  footerNote: string;
  previewText: string;
}): string =>
  emailWrapper(
    `<div style="text-align:center;">
      <h2 style="margin:0 0 10px;color:${B.text};font-size:21px;font-weight:700;font-family:'Inter',Arial,sans-serif;">${opts.title}</h2>
      <p style="margin:0 0 28px;color:${B.textMuted};font-size:15px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${opts.subtitle}</p>

      <!-- OTP block -->
      <div class="otp-block" style="display:inline-block;background:${B.primaryLight};border:2px solid ${B.primary};border-radius:8px;padding:24px 36px;margin:0 auto 24px;min-width:200px;">
        <p style="margin:0 0 8px;color:${B.primary};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:'Inter',Arial,sans-serif;">One-Time Code</p>
        <p class="otp-digits" style="margin:0;color:${B.primaryDark};font-size:34px;font-weight:800;letter-spacing:10px;font-family:'Inter',Arial,monospace;">${opts.otp}</p>
      </div>

      <p style="margin:0 0 6px;color:${B.textMuted};font-size:14px;font-family:'Inter',Arial,sans-serif;">
        This code expires in <strong style="color:${B.text};">${OTP_EXPIRY_MINUTES} minutes</strong>.
      </p>
      <p style="margin:0 0 28px;color:${B.textSubtle};font-size:12px;font-family:'Inter',Arial,sans-serif;">Never share this code with anyone.</p>

      ${divider()}

      <p style="margin:0;color:${B.textSubtle};font-size:12px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${opts.footerNote}</p>
    </div>`,
    opts.previewText
  );

const interviewStatusLabel = {
  scheduled: 'Interview Scheduled',
  cancelled: 'Interview Cancelled',
  rescheduled: 'Interview Rescheduled',
};

const interviewStatusColor = {
  scheduled: B.success,
  cancelled: B.danger,
  rescheduled: B.warning,
};

const interviewStatusBg = {
  scheduled: B.successLight,
  cancelled: B.dangerLight,
  rescheduled: B.warningLight,
};

const interviewCalloutText = {
  scheduled:
    'Please make sure you are available at the scheduled time and join a few minutes early. Good luck!',
  cancelled:
    'This interview has been cancelled. Please reach out to the company if you have any questions.',
  rescheduled:
    'Your interview has been moved. Please check the updated date and time above.',
};

export const sendInterviewEmail = async (opts: {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: Date;
  durationMins: number;
  mode: string;
  meetLink?: string;
  notes?: string;
  status: 'scheduled' | 'cancelled' | 'rescheduled';
}): Promise<void> => {
  const dateStr = opts.scheduledAt.toLocaleString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  const modeLabel = opts.mode
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const color = interviewStatusColor[opts.status];
  const bg = interviewStatusBg[opts.status];
  const label = interviewStatusLabel[opts.status];

  const html = emailWrapper(
    `
    ${heading(label)}
    ${para(`Hi <strong>${opts.candidateName}</strong>,`)}
    ${para(`This is regarding your interview for the <strong>${opts.jobTitle}</strong> role at <strong>${opts.companyName}</strong>.`)}
    ${infoTable(
      infoRow('Date &amp; Time', `<strong>${dateStr} IST</strong>`) +
        infoRow('Duration', `${opts.durationMins} minutes`) +
        infoRow('Mode', modeLabel) +
        (opts.meetLink
          ? infoRow(
              'Meet Link',
              `<a href="${opts.meetLink}" style="color:${B.primary};text-decoration:underline;">${opts.meetLink}</a>`
            )
          : '') +
        infoRow('Status', badge(label, color, bg))
    )}
    ${opts.notes ? callout(`<strong>Note from ${opts.companyName}:</strong> ${opts.notes}`) : ''}
    ${callout(interviewCalloutText[opts.status], color, bg)}
    ${divider()}
    ${para(`— ${opts.companyName} via HireLoop`, true)}
  `,
    `${label} — ${opts.jobTitle} at ${opts.companyName}`
  );

  const subjectMap = {
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
  };

  try {
    await sendMail({
      from: env.GMAIL_FROM,
      to: opts.to,
      subject: `Interview ${subjectMap[opts.status]}: ${opts.jobTitle} at ${opts.companyName}`,
      html,
    });
  } catch (err) {
    logger.error('Interview email failed:', err);
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  applicationId?: string,
  type?: string
): Promise<void> => {
  let logId: string | undefined;

  if (applicationId && type) {
    const log = await prisma.emailLog.create({
      data: { applicationId, type, to, subject, status: 'PENDING' },
    });
    logId = log.id;
  }

  try {
    await sendMail({ from: env.GMAIL_FROM, to, subject, html });

    if (logId) {
      await prisma.emailLog.update({
        where: { id: logId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }
  } catch (err) {
    logger.error('Email send failed:', err);
    if (logId) {
      await prisma.emailLog.update({
        where: { id: logId },
        data: { status: 'FAILED', error: (err as Error).message },
      });
    }
  }
};

export const sendApplicationEmail = async (
  to: string,
  subject: string,
  body: string,
  applicationId: string,
  type: string
): Promise<void> => {
  const html = emailWrapper(
    body
      .split('\n')
      .filter(Boolean)
      .map((line) => para(line))
      .join('')
  );
  await sendEmail(to, subject, html, applicationId, type);
};

export const sendApplicationReceivedEmail = async (opts: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  applicationId: string;
}): Promise<void> => {
  const {
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    applicationId,
  } = opts;

  const html = emailWrapper(
    `
    ${heading('Application Received')}
    ${para(`Hi <strong>${candidateName}</strong>,`)}
    ${para(`We've received your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.`)}
    ${infoTable(
      infoRow('Position', jobTitle) +
        infoRow('Company', companyName) +
        infoRow('Status', badge('Under Review', B.warning, B.warningLight))
    )}
    ${callout("Our AI screening is running in the background. You'll hear from the company as they review your profile. Keep your HireLoop profile up to date!")}
    ${divider()}
    ${para('Good luck with your application!', true)}
  `,
    `Your application for ${jobTitle} at ${companyName} has been received.`
  );

  await sendEmail(
    candidateEmail,
    `Application received — ${jobTitle} at ${companyName}`,
    html,
    applicationId,
    'application_received'
  );
};

export const sendNewApplicationAlertEmail = async (opts: {
  companyEmail: string;
  companyName: string;
  candidateName: string;
  jobTitle: string;
  applicationId: string;
  appliedAt: string;
}): Promise<void> => {
  const {
    companyEmail,
    companyName,
    candidateName,
    jobTitle,
    applicationId,
    appliedAt,
  } = opts;

  const html = emailWrapper(
    `
    ${heading('New Application Received')}
    ${para(`Hi <strong>${companyName}</strong> team,`)}
    ${para(`A new candidate has applied for your <strong>${jobTitle}</strong> position.`)}
    ${infoTable(
      infoRow('Candidate', `<strong>${candidateName}</strong>`) +
        infoRow('Position', jobTitle) +
        infoRow(
          'Applied',
          new Date(appliedAt).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        ) +
        infoRow('AI Screening', badge('In progress', B.warning, B.warningLight))
    )}
    ${callout('Log in to your HireLoop dashboard to view their profile and resume. AI screening results will be available shortly.')}
  `,
    `${candidateName} applied for ${jobTitle}.`
  );

  await sendEmail(
    companyEmail,
    `New application for ${jobTitle} — ${candidateName}`,
    html,
    applicationId,
    'new_application_alert'
  );
};

export const sendScreeningCompleteEmail = async (opts: {
  companyEmail: string;
  candidateName: string;
  jobTitle: string;
  aiScore: number;
  aiSummary: string;
  applicationId: string;
}): Promise<void> => {
  const {
    companyEmail,
    candidateName,
    jobTitle,
    aiScore,
    aiSummary,
    applicationId,
  } = opts;

  const scoreColor =
    aiScore >= 75 ? B.success : aiScore >= 50 ? B.warning : B.danger;
  const scoreBg =
    aiScore >= 75
      ? B.successLight
      : aiScore >= 50
        ? B.warningLight
        : B.dangerLight;
  const scoreLabel =
    aiScore >= 75
      ? 'Strong match'
      : aiScore >= 50
        ? 'Moderate match'
        : 'Low match';

  const html = emailWrapper(
    `
    ${heading('AI Screening Complete')}
    ${para(`The AI has finished screening <strong>${candidateName}</strong>'s application for <strong>${jobTitle}</strong>.`)}
    ${infoTable(
      infoRow('Candidate', `<strong>${candidateName}</strong>`) +
        infoRow('Position', jobTitle) +
        infoRow('AI Score', scoreChip(aiScore)) +
        infoRow('Verdict', badge(scoreLabel, scoreColor, scoreBg))
    )}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background:${B.surfaceRaised};border:1px solid ${B.border};border-radius:6px;margin:20px 0;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${B.primary};text-transform:uppercase;letter-spacing:1px;font-family:'Inter',Arial,sans-serif;">AI Summary</p>
          <p style="margin:0;color:${B.text};font-size:14px;line-height:1.7;font-family:'Inter',Arial,sans-serif;">${aiSummary}</p>
        </td>
      </tr>
    </table>
    ${callout('Log in to your HireLoop dashboard to shortlist, reject, or schedule an interview with this candidate.')}
  `,
    `AI screening for ${candidateName} — ${aiScore}/100.`
  );

  await sendEmail(
    companyEmail,
    `AI Screening: ${candidateName} for ${jobTitle} — ${aiScore}/100`,
    html,
    applicationId,
    'screening_complete'
  );
};
