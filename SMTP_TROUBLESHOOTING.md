# SMTP Troubleshooting Guide

## Common Error: ECONNREFUSED (Connection Refused)

This error means the application cannot connect to your SMTP server. Here are the most common causes and solutions:

### 1. Check SMTP Host and Port

**For smtp.2030ai.co.za:**
- Try different ports:
  - Port **587** (STARTTLS) - Most common
  - Port **465** (SSL/TLS)
  - Port **25** (Usually blocked by ISPs)
  - Port **2525** (Alternative)

**Test your SMTP server connectivity:**
```bash
# Test if port is open
telnet smtp.2030ai.co.za 587

# Or using nc (netcat)
nc -zv smtp.2030ai.co.za 587
```

### 2. Firewall/Network Issues

- **Corporate/Office Network:** Your network might be blocking SMTP ports
- **ISP Blocking:** Some ISPs block port 25 and sometimes 587
- **Local Firewall:** Check macOS firewall settings
- **VPN:** If using VPN, try disconnecting

### 3. SMTP Server Configuration

The server `smtp.2030ai.co.za` might:
- Require a specific authentication method
- Only accept connections from whitelisted IPs
- Need STARTTLS to be explicitly enabled
- Require a different port

### 4. Development Environment Limitations

Next.js in development mode might have issues with nodemailer. Try:

```bash
# Stop the dev server
# Press Ctrl+C

# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### 5. Alternative: Use SendGrid/Resend Instead

For development and production, consider using API-based email services:

**SendGrid (Free tier: 100 emails/day):**
1. Sign up at https://sendgrid.com
2. Create an API key
3. In Settings, select "SendGrid" as provider
4. Paste your API key

**Resend (Free tier: 100 emails/day):**
1. Sign up at https://resend.com
2. Create an API key
3. In Settings, select "Resend" as provider
4. Paste your API key

These services work immediately without SMTP configuration.

### 6. Test SMTP Connection Separately

Create a test script to verify SMTP works:

```javascript
// test-smtp.js
const nodemailer = require('nodemailer');

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.2030ai.co.za',
    port: 587,
    secure: false,
    auth: {
      user: 'tech@2030ai.co.za',
      pass: 'YOUR_PASSWORD_HERE'
    },
    debug: true,
    logger: true
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    const info = await transporter.sendMail({
      from: 'tech@2030ai.co.za',
      to: 'tech@2030ai.co.za',
      subject: 'Test Email',
      text: 'This is a test email'
    });
    
    console.log('✅ Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSMTP();
```

Run it:
```bash
node test-smtp.js
```

### 7. Check Server-Side Logs

Look at the terminal where `npm run dev` is running. You should see detailed logs including:
- "Creating SMTP transporter with config"
- "Verifying SMTP connection..."
- Any specific error codes (EAUTH, ECONNREFUSED, etc.)

### 8. Try Gmail for Testing

If your server isn't working, test with Gmail to verify the code works:

1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use these settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: Your Gmail address
   - Password: The generated App Password (not your regular password)

### 9. Contact Your Email Administrator

If you're using `smtp.2030ai.co.za`, contact your email admin to verify:
- ✓ SMTP is enabled for your account
- ✓ The correct port to use
- ✓ Whether TLS/SSL is required
- ✓ If your IP needs to be whitelisted
- ✓ Authentication method required

### Error Code Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| ECONNREFUSED | Can't connect to server | Check host/port, test with telnet |
| ETIMEDOUT | Connection timed out | Network/firewall issue |
| EAUTH | Authentication failed | Wrong username/password |
| ESOCKET | Socket error | Network connectivity issue |
| 535 | Authentication failed | Check credentials |
| 550 | Mailbox unavailable | Check "from" email address |

### Quick Fix Checklist

- [ ] Double-check SMTP host: `smtp.2030ai.co.za`
- [ ] Try port 587 (currently set)
- [ ] Try port 465
- [ ] Verify username: `tech@2030ai.co.za`
- [ ] Confirm password is correct
- [ ] Check terminal logs for specific error
- [ ] Test with `telnet smtp.2030ai.co.za 587`
- [ ] Try from a different network
- [ ] Consider using SendGrid/Resend instead
