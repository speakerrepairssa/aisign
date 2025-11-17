'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Mail, Webhook, Key, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Settings {
  email: {
    provider: 'smtp' | 'sendgrid' | 'resend' | 'mailgun';
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    apiKey?: string;
    fromEmail: string;
    fromName: string;
    enabled: boolean;
  };
  webhook: {
    url: string;
    secret?: string;
    events: string[];
    enabled: boolean;
  };
}

const DEFAULT_SETTINGS: Settings = {
  email: {
    provider: 'smtp',
    fromEmail: '',
    fromName: 'AiSign',
    enabled: false,
  },
  webhook: {
    url: '',
    events: [],
    enabled: false,
  },
};

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'webhook' | 'api'>('email');

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, 'settings', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() as Settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'settings', user.uid);
      await setDoc(docRef, settings, { merge: true });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfig = async () => {
    if (!user?.email) {
      toast.error('User email not found');
      return;
    }

    setTesting(true);
    try {
      console.log('Sending test email request with config:', {
        provider: settings.email.provider,
        smtpHost: settings.email.smtpHost,
        smtpPort: settings.email.smtpPort,
        fromEmail: settings.email.fromEmail,
      });

      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: settings.email,
          testEmail: user.email,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        toast.success('Test email sent successfully! Check your inbox.');
      } else {
        toast.error(`Test failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error testing email:', error);
      toast.error(`Failed to send test email: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testWebhook = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: settings.webhook }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Webhook test successful!');
      } else {
        toast.error(`Webhook test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to test webhook');
    } finally {
      setTesting(false);
    }
  };

  const webhookEvents = [
    { id: 'form.viewed', label: 'Form Viewed', description: 'When a recipient opens the form' },
    { id: 'form.started', label: 'Form Started', description: 'When a recipient starts filling' },
    { id: 'form.completed', label: 'Form Completed', description: 'When a form is submitted' },
    { id: 'form.declined', label: 'Form Declined', description: 'When a recipient declines' },
    { id: 'submission.created', label: 'Submission Created', description: 'When a new submission is created' },
    { id: 'submission.completed', label: 'Submission Completed', description: 'When submission is completed' },
    { id: 'submission.expired', label: 'Submission Expired', description: 'When submission expires' },
    { id: 'submission.archived', label: 'Submission Archived', description: 'When submission is archived' },
    { id: 'template.created', label: 'Template Created', description: 'When a new template is created' },
    { id: 'template.updated', label: 'Template Updated', description: 'When a template is updated' },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('email')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'email'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Mail className="inline h-5 w-5 mr-2" />
                  Email Configuration
                </button>
                <button
                  onClick={() => setActiveTab('webhook')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'webhook'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Webhook className="inline h-5 w-5 mr-2" />
                  Webhooks
                </button>
                <button
                  onClick={() => setActiveTab('api')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'api'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Key className="inline h-5 w-5 mr-2" />
                  API Keys
                </button>
              </nav>
            </div>
          </div>

          {/* Email Configuration Tab */}
          {activeTab === 'email' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Email Configuration</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, enabled: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Enable Email Notifications</span>
                </label>
              </div>

              <div className="space-y-6">
                {/* Email Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Provider
                  </label>
                  <select
                    value={settings.email.provider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, provider: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="resend">Resend</option>
                    <option value="mailgun">Mailgun</option>
                  </select>
                </div>

                {/* From Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, fromEmail: e.target.value },
                        })
                      }
                      placeholder="noreply@yourdomain.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={settings.email.fromName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, fromName: e.target.value },
                        })
                      }
                      placeholder="AiSign"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* SMTP Settings */}
                {settings.email.provider === 'smtp' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900">SMTP Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={settings.email.smtpHost || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, smtpHost: e.target.value },
                            })
                          }
                          placeholder="smtp.gmail.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={settings.email.smtpPort || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, smtpPort: parseInt(e.target.value) },
                            })
                          }
                          placeholder="587"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Username
                        </label>
                        <input
                          type="text"
                          value={settings.email.smtpUser || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, smtpUser: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Password
                        </label>
                        <input
                          type="password"
                          value={settings.email.smtpPassword || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              email: { ...settings.email, smtpPassword: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* API Key for other providers */}
                {settings.email.provider !== 'smtp' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={settings.email.apiKey || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, apiKey: e.target.value },
                        })
                      }
                      placeholder="Enter your API key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Get your API key from{' '}
                      {settings.email.provider === 'sendgrid' && 'SendGrid Dashboard'}
                      {settings.email.provider === 'resend' && 'Resend Dashboard'}
                      {settings.email.provider === 'mailgun' && 'Mailgun Dashboard'}
                    </p>
                  </div>
                )}

                {/* Special note for Mailgun */}
                {settings.email.provider === 'mailgun' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mailgun Domain
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpHost || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email: { ...settings.email, smtpHost: e.target.value },
                        })
                      }
                      placeholder="mg.yourdomain.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button
                    onClick={testEmailConfig}
                    disabled={testing || !settings.email.enabled}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    <TestTube className="h-5 w-5" />
                    {testing ? 'Testing...' : 'Send Test Email'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Webhook Configuration Tab */}
          {activeTab === 'webhook' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Webhook Configuration</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.webhook.enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        webhook: { ...settings.webhook, enabled: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Enable Webhooks</span>
                </label>
              </div>

              <div className="space-y-6">
                {/* Webhook URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={settings.webhook.url}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        webhook: { ...settings.webhook, url: e.target.value },
                      })
                    }
                    placeholder="https://your-app.com/webhook"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Webhooks will be sent to this URL for subscribed events
                  </p>
                </div>

                {/* Webhook Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook Secret (Optional)
                  </label>
                  <input
                    type="password"
                    value={settings.webhook.secret || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        webhook: { ...settings.webhook, secret: e.target.value },
                      })
                    }
                    placeholder="Your webhook secret for signature verification"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Used to generate HMAC signature in X-AiSign-Signature header
                  </p>
                </div>

                {/* Webhook Events */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Subscribe to Events
                  </label>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {webhookEvents.map((event) => (
                      <label
                        key={event.id}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={settings.webhook.events.includes(event.id)}
                          onChange={(e) => {
                            const events = e.target.checked
                              ? [...settings.webhook.events, event.id]
                              : settings.webhook.events.filter((ev) => ev !== event.id);
                            setSettings({
                              ...settings,
                              webhook: { ...settings.webhook, events },
                            });
                          }}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{event.label}</div>
                          <div className="text-sm text-gray-500">{event.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button
                    onClick={testWebhook}
                    disabled={testing || !settings.webhook.enabled}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    <TestTube className="h-5 w-5" />
                    {testing ? 'Testing...' : 'Test Webhook'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <APIKeysTab user={user} />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// API Keys Tab Component
function APIKeysTab({ user }: { user: any }) {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/keys?userId=${user.uid}`);
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!user || !newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          name: newKeyName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedKey(data.apiKey.key);
        setNewKeyName('');
        loadApiKeys();
        toast.success('API key generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, userId: user?.uid }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('API key deleted');
        loadApiKeys();
      } else {
        toast.error(data.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-600 mt-1">
            Use these keys to authenticate API requests from n8n, Make.com, or custom apps
          </p>
        </div>
        <button
          onClick={() => setShowNewKeyModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium"
        >
          <Key className="h-5 w-5" />
          Generate New Key
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Use API keys to authenticate requests to AiSign API. See{' '}
          <a href="/api-docs" className="underline font-medium">
            API Documentation
          </a>{' '}
          for integration details.
        </p>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="font-medium">No API keys yet</p>
          <p className="text-sm mt-2">Generate your first API key to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">{key.name}</h3>
                    {key.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </span>
                    )}
                  </div>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                    {key.key}
                  </code>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.lastUsed && (
                      <span>Last used: {new Date(key.lastUsed).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteApiKey(key.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Delete API key"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate API Key</h3>
            
            {generatedKey ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800 mb-2 font-medium">
                    ✅ API Key Generated Successfully!
                  </p>
                  <p className="text-xs text-green-700">
                    Copy this key now - you won't be able to see it again!
                  </p>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedKey}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Copy
                  </button>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setGeneratedKey(null);
                      setShowNewKeyModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., n8n Integration, Production API"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setNewKeyName('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateApiKey}
                    disabled={creating || !newKeyName.trim()}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {creating ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
