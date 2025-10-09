const nodemailer = require('nodemailer');

// Create a reusable transporter using environment variables
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
  });
}

// POST /api/support/contact
async function sendSupportMessage(req, res) {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'name, email, subject, and message are required' });
    }

    const toAddress = process.env.SUPPORT_TO_EMAIL || 'arpitsharma4002@gmail.com';

    const transporter = createTransporter();

    const html = `
      <h2>New Support Message</h2>
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit">${message}</pre>
      <hr />
      <small>Mindful Commune AI</small>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `Mindful Commune AI <${process.env.SMTP_USER}>`,
      to: toAddress,
      subject: `[Support] ${subject}`,
      replyTo: email,
      html,
    });

    res.json({ ok: true, message: 'Support message sent' });
  } catch (err) {
    console.error('Error sending support email:', err);
    res.status(500).json({ error: 'Failed to send support message' });
  }
}

module.exports = { sendSupportMessage };


