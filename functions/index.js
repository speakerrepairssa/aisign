const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({origin: true});

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

// Test Email Function
exports.testEmail = onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {config, testEmail} = req.body;

      if (!testEmail) {
        return res.status(400).json({
          success: false,
          error: "Test email address required",
        });
      }

      if (!config.provider) {
        return res.status(400).json({
          success: false,
          error: "Email provider not configured",
        });
      }

      console.log("Test email request:", {
        provider: config.provider,
        testEmail: testEmail,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
      });

      let result;
      if (config.provider === "smtp") {
        result = await sendViaSMTP({
          to: testEmail,
          subject: "AiSign Email Configuration Test",
          html: getTestEmailHTML(config),
          text: "Email configuration test successful!",
        }, config);
      } else {
        return res.status(400).json({
          success: false,
          error: `Provider ${config.provider} not yet implemented`,
        });
      }

      return res.json({success: true, messageId: result.messageId});
    } catch (error) {
      console.error("Email test error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to send test email",
      });
    }
  });
});

// Helper: Send via SMTP
async function sendViaSMTP(email, config) {
  if (!config.smtpHost || !config.smtpPort ||
      !config.smtpUser || !config.smtpPassword) {
    throw new Error("SMTP configuration incomplete");
  }

  console.log("Creating SMTP transporter:", {
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

  console.log("Verifying SMTP connection...");
  await transporter.verify();
  console.log("SMTP verified, sending email...");

  const info = await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  console.log("Email sent:", info.messageId);
  return {success: true, messageId: info.messageId};
}

// Helper: Test email HTML
function getTestEmailHTML(config) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; 
                  text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; 
                   border-radius: 0 0 8px 8px; }
        .success-badge { background: #10B981; color: white; 
                        padding: 8px 16px; border-radius: 20px; 
                        display: inline-block; }
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
            ${config.provider === "smtp" ?
    `<li>SMTP Host: ${config.smtpHost}</li>
             <li>SMTP Port: ${config.smtpPort}</li>` : ""}
          </ul>
          <p>You're all set to send signature request emails.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
