const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send email helper function
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
const sendEmail = async (to, subject, html) => {
  // safety fallback to console.log the link
  const linkRegex = /href="([^"]+)"/i;
  const match = html.match(linkRegex);
  if (match && match[1]) {
    console.log(`\n==================================================`);
    console.log(`[EMAIL SEND FALLBACK] Target: ${to}`);
    console.log(`[EMAIL SEND FALLBACK] Subject: ${subject}`);
    console.log(`[EMAIL SEND FALLBACK] Link: ${match[1]}`);
    console.log(`==================================================\n`);
  } else {
    console.log(`\n==================================================`);
    console.log(`[EMAIL SEND FALLBACK] Target: ${to}`);
    console.log(`[EMAIL SEND FALLBACK] Subject: ${subject}`);
    console.log(`==================================================\n`);
  }

  const attachments = [];
  const logoPath = path.join(__dirname, '../../public/logo.png');
  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'logo.png',
      path: logoPath,
      cid: 'logo'
    });
  }

  const mailOptions = {
    from: `"CodeForge Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
  transporter,
};
