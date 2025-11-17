# Email Configuration Guide

## SMTP Email Setup

The application now supports sending real emails via SMTP. Here's how to configure it:

### Common SMTP Settings

#### Gmail
- **SMTP Host:** `smtp.gmail.com`
- **SMTP Port:** `587` (TLS) or `465` (SSL)
- **SMTP Username:** Your Gmail address
- **SMTP Password:** Use an App Password (not your regular password)
  - Enable 2FA on your Google account
  - Go to: https://myaccount.google.com/apppasswords
  - Create an App Password for "Mail"
  - Use this generated password

#### 2030.ai Mail Server
- **SMTP Host:** `smtp.2030ai.co.za`
- **SMTP Port:** `587`
- **SMTP Username:** `tech@2030ai.co.za`
- **SMTP Password:** Your email password

#### Office 365/Outlook
- **SMTP Host:** `smtp-mail.outlook.com` or `smtp.office365.com`
- **SMTP Port:** `587`
- **SMTP Username:** Your full email address
- **SMTP Password:** Your account password

#### Other Providers
- Check your email provider's SMTP settings documentation

### Configuration Steps

1. Navigate to **Settings** in the application
2. Click on the **Email Configuration** tab
3. Select **SMTP** as the provider
4. Fill in the following fields:
   - **From Email:** The email address that will appear as sender
   - **From Name:** Your name or organization name (e.g., "AiSign")
   - **SMTP Host:** Your mail server address
   - **SMTP Port:** Usually 587 for TLS or 465 for SSL
   - **SMTP Username:** Usually your full email address
   - **SMTP Password:** Your email password or app password
5. Click **Save Settings**
6. Click **Send Test Email** to verify the configuration

### Security Notes

- Port 587 uses STARTTLS (recommended)
- Port 465 uses SSL/TLS
- Never commit SMTP credentials to version control
- Use environment variables for production deployments
- For Gmail, always use App Passwords instead of your main password

### Troubleshooting

#### "SMTP configuration incomplete"
- Ensure all fields (host, port, username, password) are filled in

#### "SMTP error: Invalid login"
- Double-check your username and password
- For Gmail, ensure you're using an App Password
- Verify 2FA is enabled for Gmail

#### "Connection timeout"
- Check if your SMTP port is correct
- Verify your firewall isn't blocking the port
- Try switching between port 587 and 465

#### "Authentication failed"
- Ensure your username is correct (usually full email address)
- Verify password is correct
- For Gmail, generate a new App Password

### Alternative Providers

The application also supports:
- **SendGrid** - API-based email service
- **Resend** - Modern email API
- **Mailgun** - Transactional email service

These providers don't require SMTP configuration and may have better deliverability for production use.
