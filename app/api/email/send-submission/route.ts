import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { recipient, submissionLink, templateName, senderName, config } = await request.json();

    if (!recipient || !submissionLink || !templateName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!config || !config.provider) {
      return NextResponse.json(
        { success: false, error: 'Email configuration not found' },
        { status: 400 }
      );
    }

    console.log('Sending submission email to:', recipient.email);

    const emailContent = {
      to: recipient.email,
      subject: `📝 ${senderName || 'Someone'} sent you a document to sign`,
      html: getSubmissionEmailHTML(recipient, submissionLink, templateName, senderName || 'Someone'),
      text: `Hi ${recipient.name || recipient.email},\n\n` +
        `${senderName || 'Someone'} has sent you "${templateName}" to review and sign.\n\n` +
        `Click here to view and sign: ${submissionLink}\n\n` +
        `This link is unique to you and will expire after completion.`,
    };

    if (config.provider === 'smtp') {
      const result = await sendViaSMTP(emailContent, config);
      
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        recipient: recipient.email,
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Provider ${config.provider} not yet implemented` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error sending submission email:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function sendViaSMTP(email: any, config: any) {
  if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
    throw new Error('SMTP configuration incomplete');
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  await transporter.verify();
  const info = await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  console.log('Email sent:', info.messageId);
  return info;
}

function getSubmissionEmailHTML(recipient: any, link: string, templateName: string, senderName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; 
               margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 20px auto; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); 
                  color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: white; padding: 40px 30px; }
        .greeting { font-size: 18px; color: #1F2937; margin-bottom: 20px; }
        .message { color: #4B5563; margin-bottom: 30px; }
        .document-box { background: #F9FAFB; border: 2px solid #E5E7EB; 
                        border-radius: 8px; padding: 20px; margin: 20px 0; 
                        text-align: center; }
        .document-name { font-size: 20px; font-weight: bold; 
                        color: #1F2937; margin: 10px 0; }
        .cta-button { display: inline-block; background: #4F46E5; 
                     color: white !important; text-decoration: none; 
                     padding: 14px 32px; border-radius: 8px; 
                     font-weight: bold; margin: 20px 0; 
                     transition: background 0.3s; }
        .cta-button:hover { background: #4338CA; }
        .footer { background: #F9FAFB; padding: 20px; 
                 text-align: center; color: #6B7280; font-size: 14px; }
        .security-note { background: #FEF3C7; border-left: 4px solid #F59E0B; 
                        padding: 12px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Document Signature Request</h1>
        </div>
        <div class="content">
          <p class="greeting">Hi ${recipient.name || recipient.email},</p>
          
          <p class="message">
            <strong>${senderName}</strong> has sent you a document that 
            requires your attention and signature.
          </p>
          
          <div class="document-box">
            <div style="font-size: 48px;">📄</div>
            <div class="document-name">${templateName}</div>
          </div>
          
          <p class="message">
            Please review the document and fill in the required fields. 
            Your signature will be securely captured and the completed 
            document will be sent to all parties.
          </p>
          
          <div style="text-align: center;">
            <a href="${link}" class="cta-button">
              📝 View &amp; Sign Document
            </a>
          </div>
          
          <div class="security-note">
            <strong>🔒 Security Note:</strong> This link is unique to you 
            and will only work once. It will expire after the document is 
            completed.
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            If you have any questions about this document, please contact 
            ${senderName} directly.
          </p>
        </div>
        <div class="footer">
          <p>Powered by AiSign - Secure Document Signing</p>
          <p style="margin-top: 10px;">
            <a href="${link}" style="color: #4F46E5;">View Document</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
