'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Code, Webhook, Mail, Key, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function APIDocsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Documentation</h1>
          <p className="text-gray-600 mb-8">
            Integrate AiSign with your applications using our API, webhooks, and email notifications
          </p>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <a href="#webhooks" className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <Webhook className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Webhooks</h3>
              <p className="text-sm text-gray-600">Real-time event notifications</p>
            </a>
            <a href="#email" className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <Mail className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Email Setup</h3>
              <p className="text-sm text-gray-600">Configure email providers</p>
            </a>
            <a href="#api" className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <Key className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-900">API Endpoints</h3>
              <p className="text-sm text-gray-600">REST API reference</p>
            </a>
          </div>

          {/* Webhooks Section */}
          <div id="webhooks" className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Webhook className="h-6 w-6" />
              Webhooks
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
                <p className="text-gray-600 mb-4">
                  Webhooks allow you to receive real-time notifications when events occur in AiSign.
                  Configure your webhook URL in <a href="/settings" className="text-primary-600 underline">Settings</a>.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Events</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">form.viewed</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Recipient opens the form</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">form.started</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Recipient starts filling the form</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">form.completed</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Form is submitted</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">submission.created</td>
                        <td className="px-4 py-3 text-sm text-gray-600">New submission is created</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">submission.completed</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Submission is completed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Webhook Payload</h3>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <button
                    onClick={() => copyToClipboard(`{
  "event": "form.completed",
  "timestamp": "2025-11-17T23:00:00Z",
  "data": {
    "submission_id": "abc123",
    "form_name": "Tax Form TPOA",
    "recipient_email": "user@example.com",
    "values": {
      "field_1": "John Doe",
      "field_2": "123456789"
    }
  }
}`)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <pre className="text-sm text-gray-100 overflow-x-auto">
{`{
  "event": "form.completed",
  "timestamp": "2025-11-17T23:00:00Z",
  "data": {
    "submission_id": "abc123",
    "form_name": "Tax Form TPOA",
    "recipient_email": "user@example.com",
    "values": {
      "field_1": "John Doe",
      "field_2": "123456789"
    }
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Signature Verification</h3>
                <p className="text-gray-600 mb-4">
                  If you provide a webhook secret, we'll include an <code className="bg-gray-100 px-2 py-1 rounded">X-AiSign-Signature</code> header with HMAC-SHA256 signature.
                </p>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-100 overflow-x-auto">
{`// Node.js example
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' + 
    crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  
  return signature === expectedSignature;
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Email Configuration Section */}
          <div id="email" className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Email Configuration
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Supported Providers</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li><strong>SMTP</strong> - Use any SMTP server (Gmail, Office 365, custom)</li>
                  <li><strong>SendGrid</strong> - High-deliverability transactional email</li>
                  <li><strong>Resend</strong> - Modern email API for developers</li>
                  <li><strong>Mailgun</strong> - Powerful email automation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Templates</h3>
                <p className="text-gray-600 mb-4">
                  AiSign automatically sends beautifully formatted emails for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Signature requests to recipients</li>
                  <li>Completion confirmations</li>
                  <li>Reminder notifications</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Setup Example (SendGrid)</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Create a SendGrid account at <a href="https://sendgrid.com" className="text-primary-600 underline" target="_blank">sendgrid.com</a></li>
                  <li>Generate an API key in Settings → API Keys</li>
                  <li>Go to <a href="/settings" className="text-primary-600 underline">AiSign Settings</a></li>
                  <li>Select "SendGrid" as provider</li>
                  <li>Paste your API key</li>
                  <li>Set your from email and name</li>
                  <li>Click "Send Test Email" to verify</li>
                </ol>
              </div>
            </div>
          </div>

          {/* API Endpoints Section */}
          <div id="api" className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Code className="h-6 w-6" />
              API Endpoints
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication</h3>
                <p className="text-gray-600 mb-4">
                  Generate an API key in <a href="/settings" className="text-primary-600 underline">Settings → API Keys</a> and include it in your requests:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Option 1: X-API-Key header (Recommended)</p>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <pre className="text-sm text-gray-100">
{`X-API-Key: aisign_your_api_key_here`}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Option 2: Authorization Bearer</p>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <pre className="text-sm text-gray-100">
{`Authorization: Bearer aisign_your_api_key_here`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Security:</strong> Keep your API keys secure and never commit them to version control. Use environment variables for production deployments.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Submission</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <code className="text-sm font-mono">POST /api/submissions</code>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-100 overflow-x-auto">
{`curl -X POST https://your-domain.com/api/submissions \\
  -H "X-API-Key: aisign_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateId": "template_123",
    "recipientEmail": "user@example.com",
    "recipientName": "John Doe"
  }'`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fill Template</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <code className="text-sm font-mono">POST /api/templates/:templateId/fill</code>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-100 overflow-x-auto">
{`curl -X POST https://your-domain.com/api/templates/abc123/fill \\
  -H "Content-Type: application/json" \\
  -d '{
    "values": {
      "field_1": "John Doe",
      "field_2": "123-45-6789"
    },
    "recipientEmail": "user@example.com"
  }'`}
                  </pre>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Full API documentation with all endpoints, parameters, and responses coming soon!
                </p>
              </div>
            </div>
          </div>

          {/* Integration Examples */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Integration Examples</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">n8n Workflow</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Trigger document signing from your n8n workflows
                </p>
                <a href="#" className="text-sm text-primary-600 hover:underline">View example →</a>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Make.com Scenario</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Automate document workflows with Make.com
                </p>
                <a href="#" className="text-sm text-primary-600 hover:underline">View example →</a>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">WordPress Plugin</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Send signature requests from WordPress forms
                </p>
                <a href="#" className="text-sm text-primary-600 hover:underline">View example →</a>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Zapier Integration</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Connect with 5000+ apps using webhooks
                </p>
                <a href="#" className="text-sm text-primary-600 hover:underline">View example →</a>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
