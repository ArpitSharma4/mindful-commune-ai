const { Resend } = require('resend');
require('dotenv').config();

// Check if RESEND_API_KEY is set
if (!process.env.RESEND_API_KEY) {
  console.error('ERROR: RESEND_API_KEY is not set in environment variables');
}

// Initialize Resend with your API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

const handleContactForm = async (req, res) => {
  try {
    console.log('Received contact form submission:', req.body);
    const { name, email, subject, message } = req.body;

    // 1. Validation (Basic)
    if (!name || !email || !subject || !message) {
      console.error('Validation failed - missing required fields');
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // 2. Format the Email
    const emailHtml = `
      <div>
        <h2>New Support Request</h2>
        <p>You have a new contact form submission from your website.</p>
        <hr>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `;

    // 3. Send the Email (Development Mode)
    const { data, error } = await resend.emails.send({
      from: 'Support Form <onboarding@resend.dev>', // Use this "from" address for testing
      to: 'echo.well.ai@gmail.com', // This MUST be the email you used to sign up for Resend
      reply_to: email, // This still works! When you reply, it will go to the user
      subject: `Support: ${subject}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend API Error:', {
        message: error.message,
        name: error.name,
        code: error.code,
        statusCode: error.statusCode,
        response: error.originalError?.response?.data
      });
      return res.status(500).json({ 
        error: 'Failed to send message.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }

    // 4. Send Success Response
    res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Error in contact form handler:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  handleContactForm,
};