import { NextRequest, NextResponse } from 'next/server';
import { EmailConfig, sendEmail } from '@/lib/email';

// Force this route to run on Node.js runtime (not Edge)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { config, testEmail } = await request.json();

    console.log('Test email request received:', {
      provider: config?.provider,
      testEmail,
      smtpHost: config?.smtpHost,
      smtpPort: config?.smtpPort,
    });

    if (!testEmail) {
      return NextResponse.json(
        { success: false, error: 'Test email address required' },
        { status: 400 }
      );
    }

    // Validate config
    if (!config.provider) {
      return NextResponse.json(
        { success: false, error: 'Email provider not configured' },
        { status: 400 }
      );
    }

    console.log('Attempting to send test email...');
    
    // Send test email using the exported sendEmail function
    const result = await sendEmail(
      {
        to: testEmail,
        subject: 'AiSign Email Configuration Test',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .success-badge { background: #10B981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Email Test Successful!</h1>
              </div>
              <div class="content">
                <p><span class="success-badge">Test Passed</span></p>
                <p>Your email configuration is working correctly!</p>
                <p><strong>Configuration Details:</strong></p>
                <ul>
                  <li>Provider: ${config.provider}</li>
                  <li>From: ${config.fromName} &lt;${config.fromEmail}&gt;</li>
                  ${config.provider === 'smtp' ? `<li>SMTP Host: ${config.smtpHost}</li><li>SMTP Port: ${config.smtpPort}</li>` : ''}
                </ul>
                <p>You're all set to send signature request emails.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: 'Email configuration test successful! Your AiSign email setup is working correctly.',
      },
      config as EmailConfig
    );

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
