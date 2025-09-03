const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });
};

// Email templates
const emailTemplates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email - TaxiGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - TaxiGo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚕 TaxiGo</h1>
            <p>Welcome to the future of taxi booking!</p>
          </div>
          <div class="content">
            <h2>Hi ${data.name}!</h2>
            <p>Thank you for signing up with TaxiGo. To complete your registration and start booking rides, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.verificationUrl}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <p>If you didn't create an account with TaxiGo, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TaxiGo. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  passwordReset: (data) => ({
    subject: 'Password Reset Request - TaxiGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - TaxiGo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚕 TaxiGo</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hi ${data.name}!</h2>
            <p>We received a request to reset your password for your TaxiGo account. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in 10 minutes</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your current password will remain unchanged</li>
              </ul>
            </div>
            
            <p>For security reasons, this password reset link can only be used once.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TaxiGo. All rights reserved.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  bookingConfirmation: (data) => ({
    subject: 'Booking Confirmed - TaxiGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed - TaxiGo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚕 TaxiGo</h1>
            <p>Your ride is confirmed!</p>
          </div>
          <div class="content">
            <h2>Hi ${data.name}!</h2>
            <p>Great news! Your taxi booking has been confirmed. Here are the details:</p>
            
            <div class="booking-details">
              <h3>📍 Trip Details</h3>
              <p><strong>From:</strong> ${data.pickup}</p>
              <p><strong>To:</strong> ${data.destination}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Time:</strong> ${data.time}</p>
              <p><strong>Vehicle:</strong> ${data.vehicleType}</p>
              <p><strong>Total:</strong> $${data.total}</p>
            </div>
            
            <p>Your driver will contact you shortly with their estimated arrival time. You can track your ride in real-time through the TaxiGo app.</p>
            
            <p>Thank you for choosing TaxiGo!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 TaxiGo. All rights reserved.</p>
            <p>Need help? Contact our 24/7 support team.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();
    
    // Get template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }
    
    const { html } = emailTemplate(data);
    
    // Send email
    const info = await transporter.sendMail({
      from: `"TaxiGo" <${process.env.SMTP_USER || 'noreply@taxigo.com'}>`,
      to,
      subject,
      html
    });
    
    console.log('Email sent successfully:', info.messageId);
    return info;
    
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send multiple emails
const sendBulkEmail = async (emails) => {
  try {
    const transporter = createTransporter();
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await sendEmail(email);
        results.push({ success: true, email: email.to, messageId: result.messageId });
      } catch (error) {
        results.push({ success: false, email: email.to, error: error.message });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Bulk email sending failed:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  emailTemplates
};
