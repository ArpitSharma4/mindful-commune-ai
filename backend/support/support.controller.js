const { Resend } = require('resend');

// Initialize Resend with your API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

const handleContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // 1. Validation (Basic)
    if (!name || !email || !subject || !message) {
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
      // --- THIS IS THE CHANGE ---
      from: 'Support Form <onboarding@resend.dev>', // Use this "from" address for testing
      to: 'echo.well.ai@gmail.com', // This MUST be the email you used to sign up for Resend
      // --- END OF CHANGE ---
      
      reply_to: email, // This still works! When you reply, it will go to the user
      subject: `Support: ${subject}`,
      html: emailHtml,
    });

    if (error) {
      console.error({ error });
      return res.status(500).json({ error: 'Failed to send message.' });
    }

    // 4. Send Success Response
    res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Error in contact form handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  handleContactForm,
};