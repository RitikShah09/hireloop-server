"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const googleapis_1 = require("googleapis");
const env_1 = require("./env");
const oAuth2Client = new googleapis_1.google.auth.OAuth2(env_1.env.GMAIL_CLIENT_ID, env_1.env.GMAIL_CLIENT_SECRET, env_1.env.GMAIL_REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: env_1.env.GMAIL_REFRESH_TOKEN });
const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oAuth2Client });
const sendMail = async ({ from, to, subject, html, }) => {
    const messageParts = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html,
    ];
    const raw = Buffer.from(messageParts.join('\r\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
    });
};
exports.sendMail = sendMail;
//# sourceMappingURL=mailer.js.map