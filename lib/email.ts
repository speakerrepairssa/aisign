/**
 * Email Service
 * Handles sending emails for document signing workflows
 */

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'mailgun';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendSubmissionEmailParams {
  recipientEmail: string;
  recipientName: string;
  documentTitle: string;
  submissionLink: string;
  senderName?: string;
}

/**
 * Send email when submission is created
 */
export async function sendSubmissionEmail(params: SendSubmissionEmailParams, config: EmailConfig) {
  const { recipientEmail, recipientName, documentTitle, submissionLink, senderName } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .button { 
          display: inline-block; 
          background: #4F46E5; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Document Signature Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${recipientName},</h2>
          <p>${senderName || 'Someone'} has requested your signature on the following document:</p>
          <h3>${documentTitle}</h3>
          <p>Please click the button below to review and sign the document:</p>
          <a href="${submissionLink}" class="button">Sign Document</a>
          <p>Or copy this link: <a href="${submissionLink}">${submissionLink}</a></p>
          <p>Thank you!</p>
        </div>
        <div class="footer">
          <p>Powered by AiSign - Secure Document Signing</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${recipientName},

    ${senderName || 'Someone'} has requested your signature on: ${documentTitle}

    Please sign the document here: ${submissionLink}

    Thank you!
  `;

  return await sendEmail({
    to: recipientEmail,
    subject: `Signature Request: ${documentTitle}`,
    html,
    text,
  }, config);
}

/**
 * Send email when submission is completed
 */
export async function sendCompletionEmail(
  recipientEmail: string,
  documentTitle: string,
  downloadLink: string,
  config: EmailConfig
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .button { 
          display: inline-block; 
          background: #10B981; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Document Signed Successfully</h1>
        </div>
        <div class="content">
          <h2>Document Completed!</h2>
          <p>The document "${documentTitle}" has been successfully signed and completed.</p>
          <p>You can download your signed copy below:</p>
          <a href="${downloadLink}" class="button">Download Signed Document</a>
        </div>
        <div class="footer">
          <p>Powered by AiSign - Secure Document Signing</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject: `Document Signed: ${documentTitle}`,
    html,
    text: `Document "${documentTitle}" has been signed. Download: ${downloadLink}`,
  }, config);
}

/**
 * Generic email sending function
 * Export this so it can be used in API routes
 */
export async function sendEmail(email: EmailTemplate, config: EmailConfig) {
  switch (config.provider) {
    case 'smtp':
      return await sendViaSMTP(email, config);
    case 'sendgrid':
      return await sendViaSendGrid(email, config);
    case 'resend':
      return await sendViaResend(email, config);
    case 'mailgun':
      return await sendViaMailgun(email, config);
    default:
      throw new Error(`Unsupported email provider: ${config.provider}`);
  }
}

/**
 * Send via SMTP
 */
async function sendViaSMTP(email: EmailTemplate, config: EmailConfig) {
  if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
    throw new Error('SMTP configuration incomplete. Please provide host, port, username, and password.');
  }

  try {
    // Dynamic import of nodemailer to avoid bundling issues
    const nodemailer = await import('nodemailer');
    
    console.log('Creating SMTP transporter with config:', {
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      user: config.smtpUser,
    });
    
    // Create transporter
    const transporter = nodemailer.default.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
      // Add timeout and other options
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Enable debug output
      debug: true,
      logger: true,
    });

    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Send email
    console.log('Sending email to:', email.to);
    const info = await transporter.sendMail({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    console.log('SMTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('SMTP error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    
    // Provide more helpful error messages
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to SMTP server at ${config.smtpHost}:${config.smtpPort}. Please check the host and port are correct.`);
    } else if (error.code === 'EAUTH') {
      throw new Error(`SMTP authentication failed. Please check your username and password.`);
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      throw new Error(`Connection to SMTP server timed out. Please check your network connection and firewall settings.`);
    } else if (error.responseCode === 535) {
      throw new Error(`Authentication failed. Please verify your SMTP username and password.`);
    } else {
      throw new Error(`SMTP error: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid(email: EmailTemplate, config: EmailConfig) {
  if (!config.apiKey) throw new Error('SendGrid API key required');

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email.to }] }],
        from: { email: config.fromEmail, name: config.fromName },
        subject: email.subject,
        content: [
          { type: 'text/html', value: email.html },
          ...(email.text ? [{ type: 'text/plain', value: email.text }] : []),
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.statusText}`);
    }

    return { success: true, messageId: response.headers.get('x-message-id') };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
}

/**
 * Send via Resend
 */
async function sendViaResend(email: EmailTemplate, config: EmailConfig) {
  if (!config.apiKey) throw new Error('Resend API key required');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Resend error: ${data.message}`);
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Resend error:', error);
    throw error;
  }
}

/**
 * Send via Mailgun
 */
async function sendViaMailgun(email: EmailTemplate, config: EmailConfig) {
  if (!config.apiKey) throw new Error('Mailgun API key required');

  // Mailgun domain should be in smtpHost
  const domain = config.smtpHost;
  if (!domain) throw new Error('Mailgun domain required in smtpHost');

  try {
    const formData = new FormData();
    formData.append('from', `${config.fromName} <${config.fromEmail}>`);
    formData.append('to', email.to);
    formData.append('subject', email.subject);
    formData.append('html', email.html);
    if (email.text) formData.append('text', email.text);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Mailgun error: ${data.message}`);
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Mailgun error:', error);
    throw error;
  }
}
