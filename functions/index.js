const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({origin: true});

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

// Test Email Function
exports.testEmail = onRequest({minInstances: 1, timeoutSeconds: 30}, (req, res) => {
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

// Send Submission Email Function
exports.sendSubmissionEmail = onRequest(
    {minInstances: 1, timeoutSeconds: 60},
    (req, res) => {
      return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {recipient, submissionLink, templateName, senderName, config} =
        req.body;

      if (!recipient || !submissionLink || !templateName) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      if (!config || !config.provider) {
        return res.status(400).json({
          success: false,
          error: "Email configuration not found",
        });
      }

      console.log("Sending submission email to:", recipient.email);

      const emailContent = {
        to: recipient.email,
        subject: `📝 ${senderName || "Someone"} sent you a document to sign`,
        html: getSubmissionEmailHTML(
            recipient,
            submissionLink,
            templateName,
            senderName || "Someone",
        ),
        text: `Hi ${recipient.name || recipient.email},\n\n` +
          `${senderName || "Someone"} has sent you "${templateName}" ` +
          `to review and sign.\n\n` +
          `Click here to view and sign: ${submissionLink}\n\n` +
          `This link is unique to you and will expire after completion.`,
      };

      let result;
      if (config.provider === "smtp") {
        result = await sendViaSMTP(emailContent, config);
      } else {
        return res.status(400).json({
          success: false,
          error: `Provider ${config.provider} not yet implemented`,
        });
      }

      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        recipient: recipient.email,
      });
    } catch (error) {
      console.error("Error sending submission email:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
    },
);

// Helper: Submission email HTML
function getSubmissionEmailHTML(recipient, link, templateName, senderName) {
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
