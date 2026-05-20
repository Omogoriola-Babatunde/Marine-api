import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

const smtpConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

export const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export const sendMail = async (options) => {
  if (!transporter) {
    console.warn("[mailer] SMTP not configured; skipping email:", options.subject);
    return null;
  }
  return transporter.sendMail({ from: MAIL_FROM || SMTP_USER, ...options });
};
