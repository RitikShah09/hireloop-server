'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require('nodemailer'));
const env_1 = require('./env');
exports.transporter = nodemailer_1.default.createTransport({
  host: env_1.env.SMTP_HOST,
  port: parseInt(env_1.env.SMTP_PORT),
  secure: false,
  auth: {
    user: env_1.env.SMTP_USER,
    pass: env_1.env.SMTP_PASS,
  },
});
exports.transporter.verify((err) => {
  if (err) console.error('Mailer error:', err);
  else console.log('Mailer ready');
});
//# sourceMappingURL=mailer.js.map
