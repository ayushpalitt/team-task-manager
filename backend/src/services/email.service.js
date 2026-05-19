import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export const sendInviteEmail = async ({ to, projectTitle, inviterName }) => {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: `You were added to ${projectTitle}`,
    text: `${inviterName} added you to the project "${projectTitle}" in Team Task Manager.`
  });

  return { skipped: false };
};
