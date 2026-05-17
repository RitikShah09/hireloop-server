'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.sendScreeningCompleteEmail =
  exports.sendNewApplicationAlertEmail =
  exports.sendApplicationReceivedEmail =
  exports.sendApplicationEmail =
  exports.sendEmail =
    void 0;
const mailer_1 = require('../config/mailer');
const env_1 = require('../config/env');
const prisma_1 = __importDefault(require('../config/prisma'));
const logger_1 = require('../config/logger');
const B = {
  primary: '#1a6ef5',
  primaryDark: '#1259d4',
  primaryLight: '#eff6ff',
  success: '#16a34a',
  successLight: '#f0fdf4',
  warning: '#d97706',
  warningLight: '#fffbeb',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
};
const emailWrapper = (body, previewText = '') => `
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
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-body { padding: 24px 16px !important; }
      .email-footer { padding: 16px !important; }
      .info-table td { display: block; width: 100% !important; padding: 4px 12px !important; }
      .info-table td:first-child { color: ${B.textSubtle}; padding-bottom: 0 !important; font-size: 11px !important; }
      .btn { width: 100% !important; text-align: center !important; }
      h1.logo-text { font-size: 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${B.bg};font-family:'Inter',Arial,Helvetica,sans-serif;">

  <!-- Preview text (hidden) -->
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${B.bg};padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Email container -->
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
          style="max-width:600px;border-radius:12px;overflow:hidden;border:1px solid ${B.border};box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${B.primary} 0%,${B.primaryDark} 100%);padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 class="logo-text" style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;font-family:'Inter',Arial,sans-serif;">
                      Hire<span style="opacity:0.75;">Loop</span>
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="background-color:${B.surface};padding:36px 40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background-color:${B.bg};padding:20px 40px;border-top:1px solid ${B.border};">
              <p style="margin:0;color:${B.textSubtle};font-size:12px;line-height:1.6;text-align:center;">
                This email was sent by HireLoop. Please do not reply directly to this message.<br/>
                &copy; ${new Date().getFullYear()} HireLoop. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>

</body>
</html>`;
const heading = (text) =>
  `<h2 style="margin:0 0 20px;color:${B.text};font-size:22px;font-weight:700;line-height:1.3;font-family:'Inter',Arial,sans-serif;">${text}</h2>`;
const para = (text, muted = false) =>
  `<p style="margin:0 0 16px;color:${muted ? B.textMuted : B.text};font-size:15px;line-height:1.7;font-family:'Inter',Arial,sans-serif;">${text}</p>`;
const infoRow = (label, value) => `
  <tr>
    <td style="padding:10px 16px;color:${B.textMuted};font-size:13px;width:130px;vertical-align:top;white-space:nowrap;font-family:'Inter',Arial,sans-serif;">${label}</td>
    <td style="padding:10px 16px;color:${B.text};font-size:13px;font-weight:500;font-family:'Inter',Arial,sans-serif;">${value}</td>
  </tr>`;
const infoTable = (rows) => `
  <table class="info-table" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="border-radius:8px;border:1px solid ${B.border};overflow:hidden;margin:20px 0;">
    <tbody style="background:${B.bg};">${rows}</tbody>
  </table>`;
const divider = () =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="border-top:1px solid ${B.border};"></td></tr></table>`;
const callout = (
  text,
  color = B.primary,
  bg = B.primaryLight
) => `<div style="background:${bg};border-left:3px solid ${color};border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
    <p style="margin:0;color:${color === B.primary ? '#1259d4' : color};font-size:14px;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${text}</p>
  </div>`;
const scoreChip = (score) => {
  const color = score >= 75 ? B.success : score >= 50 ? B.warning : B.danger;
  const bg =
    score >= 75 ? B.successLight : score >= 50 ? B.warningLight : B.dangerLight;
  return `<span style="display:inline-block;padding:4px 14px;border-radius:99px;background:${bg};color:${color};font-weight:700;font-size:15px;font-family:'Inter',Arial,sans-serif;">${score}/100</span>`;
};
const badge = (text, color = B.primary, bg = B.primaryLight) =>
  `<span style="display:inline-block;padding:3px 10px;border-radius:99px;background:${bg};color:${color};font-size:12px;font-weight:600;font-family:'Inter',Arial,sans-serif;">${text}</span>`;
const sendEmail = async (to, subject, html, applicationId, type) => {
  let logId;
  if (applicationId && type) {
    const log = await prisma_1.default.emailLog.create({
      data: { applicationId, type, to, subject, status: 'PENDING' },
    });
    logId = log.id;
  }
  try {
    await mailer_1.transporter.sendMail({
      from: env_1.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    if (logId) {
      await prisma_1.default.emailLog.update({
        where: { id: logId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }
  } catch (err) {
    logger_1.logger.error('Email send failed:', err);
    if (logId) {
      await prisma_1.default.emailLog.update({
        where: { id: logId },
        data: { status: 'FAILED', error: err.message },
      });
    }
  }
};
exports.sendEmail = sendEmail;
const sendApplicationEmail = async (to, subject, body, applicationId, type) => {
  const html = emailWrapper(
    body
      .split('\n')
      .filter(Boolean)
      .map((line) => para(line))
      .join('')
  );
  await (0, exports.sendEmail)(to, subject, html, applicationId, type);
};
exports.sendApplicationEmail = sendApplicationEmail;
const sendApplicationReceivedEmail = async (opts) => {
  const {
    candidateEmail,
    candidateName,
    jobTitle,
    companyName,
    applicationId,
  } = opts;
  const html = emailWrapper(
    `
    ${heading('Application Received!')}
    ${para(`Hi <strong>${candidateName}</strong>,`)}
    ${para(`Great news — we've received your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.`)}
    ${infoTable(
      infoRow('Position', jobTitle) +
        infoRow('Company', companyName) +
        infoRow('Status', badge('Under Review', B.warning, B.warningLight))
    )}
    ${callout("Our AI screening is running in the background. You'll hear from the company as they review your profile. In the meantime, keep your HireLoop profile up to date!")}
    ${divider()}
    ${para('Good luck with your application!', true)}
  `,
    `Your application for ${jobTitle} at ${companyName} has been received.`
  );
  await (0, exports.sendEmail)(
    candidateEmail,
    `Application received — ${jobTitle} at ${companyName}`,
    html,
    applicationId,
    'application_received'
  );
};
exports.sendApplicationReceivedEmail = sendApplicationReceivedEmail;
const sendNewApplicationAlertEmail = async (opts) => {
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
  await (0, exports.sendEmail)(
    companyEmail,
    `New application for ${jobTitle} — ${candidateName}`,
    html,
    applicationId,
    'new_application_alert'
  );
};
exports.sendNewApplicationAlertEmail = sendNewApplicationAlertEmail;
const sendScreeningCompleteEmail = async (opts) => {
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
    <div style="background:${B.bg};border:1px solid ${B.border};border-radius:8px;padding:18px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${B.primary};text-transform:uppercase;letter-spacing:1px;font-family:'Inter',Arial,sans-serif;">AI Summary</p>
      <p style="margin:0;color:${B.text};font-size:14px;line-height:1.7;font-family:'Inter',Arial,sans-serif;">${aiSummary}</p>
    </div>
    ${callout('Log in to your HireLoop dashboard to shortlist, reject, or schedule an interview with this candidate.')}
  `,
    `AI screening for ${candidateName} — ${aiScore}/100.`
  );
  await (0, exports.sendEmail)(
    companyEmail,
    `AI Screening: ${candidateName} for ${jobTitle} — ${aiScore}/100`,
    html,
    applicationId,
    'screening_complete'
  );
};
exports.sendScreeningCompleteEmail = sendScreeningCompleteEmail;
//# sourceMappingURL=email.service.js.map
