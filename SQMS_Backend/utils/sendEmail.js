import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, htmlContent,attachments=[]) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or another email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Food Techie" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
    attachments, // ✅ Pass attachments here (like QR code image)

  });
};
