import nodemailer from 'nodemailer';
import 'dotenv/config';

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.resend.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  console.warn('⚠️ SMTP email credentials not configured. Emails will be logged to the console.');
}

/**
 * Sends an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 */
export async function sendEmail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || 'Varnam <onboarding@resend.dev>';
  
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log(`✉️ Email sent to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      throw error;
    }
  } else {
    // Strip HTML tags for clean console output
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`
======================================================
✉️  MOCK EMAIL LOG
To:      ${to}
Subject: ${subject}
From:    ${from}
Content: ${textContent}
======================================================
`);
    return { messageId: 'mock-id-' + Date.now() };
  }
}
export default sendEmail;
