const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  // Create a transporter — this is the email sender config
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define the email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  // Send it
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;