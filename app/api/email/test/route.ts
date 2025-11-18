import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { config, testEmail } = await request.json();

    if (!testEmail) {
      return NextResponse.json(
        { success: false, error: 'Test email address required' },
        { status: 400 }
      );
    }

    if (!config.provider) {
      return NextResponse.json(
        { success: false, error: 'Email provider not configured' },
        { status: 400 }
      );
    }

    console.log('Test email request:', {
      provider: config.provider,
      testEmail: testEmail,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
    });

    if (config.provider === 'smtp') {
      const result = await sendViaSMTP({
        to: testEmail,
        subject: 'AiSign Email Configuration Test',
        html: getTestEmailHTML(config),
        text: 'Email configuration test successful!',
      }, config);

      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json(
        { success: false, error: `Provider ${config.provider} not yet implemented` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}

async function sendViaSMTP(email: any, config: any) {
  if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
    throw new Error('SMTP configuration incomplete');
  }

  console.log('Creating SMTP transporter:', {
    host: config.smtpHost,
    port: config.smtpPort,
    user: config.smtpUser,
  });

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

  console.log('Verifying SMTP connection...');
  await transporter.verify();
  console.log('SMTP verified, sending email...');

  const info = await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  console.log('Email sent successfully:', info.messageId);
  return info;
}

function getTestEmailHTML(config: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✅ Email Test Successful!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Great news! Your email configuration is working correctly.
                  </p>
                  <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;"><strong>Provider:</strong> ${config.provider.toUpperCase()}</p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;"><strong>From:</strong> ${config.fromEmail}</p>
                    ${config.smtpHost ? `<p style="margin: 0; font-size: 14px; color: #666666;"><strong>SMTP Host:</strong> ${config.smtpHost}</p>` : ''}
                  </div>
                  <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                    You can now use this configuration to send document signing invitations from AiSign.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0; font-size: 12px; color: #999999;">
                    This is an automated test email from AiSign
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
