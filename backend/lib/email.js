const nodemailer = require('nodemailer');

const sendVerificationEmail = async (toEmail, code) => {
  if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'your.email@gmail.com') {
    throw new Error('⚠️ Configuration Required: You must enter your Gmail address and a 16-digit App Password in CampusFlow/backend/.env to send emails.');
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Default to Gmail for easy App Password usage
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"CampusFlow" <${process.env.SMTP_EMAIL}>`,
      to: toEmail,
      subject: 'Verify your CampusFlow Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #eaeaea; border-radius: 10px;">
          <h1 style="color: #4f46e5;">CampusFlow</h1>
          <p style="font-size: 16px; color: #333;">Welcome! To complete your registration, please enter the following verification code:</p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error('Could not send verification email. Please check your SMTP settings.');
  }
};

const sendEmail = async (toEmail, subject, html) => {
  if (!process.env.SMTP_EMAIL || process.env.SMTP_EMAIL === 'your.email@gmail.com') {
    console.warn(`[SIMULATED EMAIL TO ${toEmail}] ${subject}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
  });
  await transporter.sendMail({
    from: `"CampusFlow Automations" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject,
    html
  });
};

module.exports = { sendVerificationEmail, sendEmail };
