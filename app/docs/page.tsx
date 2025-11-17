'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  BookOpen, 
  Inbox, 
  Users, 
  Copy, 
  Archive, 
  Link as LinkIcon,
  FileText,
  Zap,
  Code,
  Download,
  Search,
  CheckCircle,
  Circle,
  AlertCircle
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', name: 'Overview', icon: BookOpen },
    { id: 'features', name: 'Features', icon: CheckCircle },
    { id: 'architecture', name: 'Architecture', icon: Code },
    { id: 'workflows', name: 'Workflows', icon: Zap },
    { id: 'api', name: 'API Reference', icon: FileText },
  ];

  const features = [
    {
      name: 'Submissions Tracking',
      icon: Inbox,
      status: 'completed',
      description: 'Real-time tracking of document submissions with status management',
      files: [
        '/types/submission.ts - Submission type definitions',
        '/hooks/useSubmissions.ts - React hook for submission management',
        '/app/submissions/page.tsx - Submissions dashboard UI',
      ],
      usage: 'Navigate to Submissions tab to view all submissions. Filter by status, search by name/email.',
    },
    {
      name: 'Recipient Management',
      icon: Users,
      status: 'completed',
      description: 'Add multiple recipients to templates with unique submission links',
      files: [
        '/components/submissions/AddRecipientsModal.tsx - Recipient modal UI',
        '/hooks/useSubmissions.ts - createSubmission() function',
      ],
      usage: 'In template editor, click "Add Recipients" button. Enter emails and names, then create submission.',
    },
    {
      name: 'Clone Templates',
      icon: Copy,
      status: 'completed',
      description: 'Duplicate templates with all placeholders and settings',
      files: [
        '/components/documents/DocumentList.tsx - handleClone() function',
      ],
      usage: 'In dashboard, click copy icon on any template. New template created with "(Copy)" suffix.',
    },
    {
      name: 'Archive Functionality',
      icon: Archive,
      status: 'completed',
      description: 'Archive/restore templates without permanent deletion',
      files: [
        '/components/documents/DocumentList.tsx - handleArchive() function',
        '/types/index.ts - isArchived field added to Document type',
      ],
      usage: 'Click archive icon to archive. Toggle "View Archived" to see archived templates. Click restore to unarchive.',
    },
    {
      name: 'Copy Link',
      icon: LinkIcon,
      status: 'completed',
      description: 'Copy shareable links for templates and submissions',
      files: [
        '/components/documents/DocumentList.tsx - handleCopyLink() function',
      ],
      usage: 'Click link icon on any document/submission. Link copied to clipboard automatically.',
    },
    {
      name: 'Character Capacity',
      icon: FileText,
      status: 'completed',
      description: 'Smart calculation of character capacity based on font and dimensions',
      files: [
        '/lib/fontDetection.ts - calculateCharacterCapacity() function',
        '/app/documents/[id]/edit/page.tsx - Real-time capacity display',
      ],
      usage: 'Resize placeholders in template editor. Capacity updates automatically showing total chars, per line, and lines.',
    },
    {
      name: 'Alignment Guides',
      icon: Zap,
      status: 'completed',
      description: 'Visual guide lines with snap-to-align for perfect placeholder positioning',
      files: [
        '/app/documents/[id]/edit/page.tsx - calculateGuideLines(), snapToGuide() functions',
        '/app/documents/[id]/edit/page.tsx - Visual guide line rendering',
      ],
      usage: 'Toggle "Guides ON/OFF" button in template editor. Drag placeholders to see blue alignment lines. Placeholders snap to edges, centers of other placeholders.',
    },
    {
      name: 'Smart Font Detection',
      icon: Zap,
      status: 'completed',
      description: 'Auto-detect PDF fonts and recommend optimal sizes',
      files: [
        '/lib/fontDetection.ts - analyzePDFFonts(), detectFontAtPosition()',
        '/app/documents/[id]/edit/page.tsx - Font analysis integration',
      ],
      usage: 'When editing templates, fonts are auto-analyzed. Recommendations shown with ✨ sparkle icon.',
    },
    {
      name: 'Export/Download',
      icon: Download,
      status: 'pending',
      description: 'Download completed PDFs and batch export',
      files: [
        'Not yet implemented',
      ],
      usage: 'Placeholder buttons in submissions dashboard. Ready for implementation.',
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary-600" />
              AiSign Documentation
            </h1>
            <p className="text-gray-600 mt-2">
              Complete guide to features, architecture, and implementation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {section.name}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-8">
                {activeSection === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                      <p className="text-gray-600 mb-4">
                        AiSign is a comprehensive document signing and template management platform with
                        features comparable to DocuSeal. Built with Next.js, Firebase, and modern web technologies.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Tech Stack</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Next.js 14 (React 18)</li>
                          <li>• TypeScript</li>
                          <li>• Firebase (Auth, Firestore, Storage)</li>
                          <li>• Tailwind CSS</li>
                          <li>• pdf-lib, pdfjs-dist</li>
                          <li>• Zustand (state management)</li>
                        </ul>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Key Capabilities</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Smart placeholder system</li>
                          <li>• Auto font detection</li>
                          <li>• Character capacity calculation</li>
                          <li>• Real-time submission tracking</li>
                          <li>• Multi-recipient support</li>
                          <li>• Template cloning & archiving</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Quick Start
                      </h3>
                      <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
                        <li>Upload PDF → Dashboard → Upload button</li>
                        <li>Create Template → Click "Template" → Add placeholders</li>
                        <li>Save Template → Click "Save Template"</li>
                        <li>Add Recipients → Click "Add Recipients" → Enter emails</li>
                        <li>Track Progress → Submissions tab → Monitor status</li>
                      </ol>
                    </div>
                  </div>
                )}

                {activeSection === 'features' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
                    <div className="space-y-4">
                      {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                          <div
                            key={feature.name}
                            className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                  <Icon className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {feature.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">{feature.description}</p>
                                </div>
                              </div>
                              {feature.status === 'completed' ? (
                                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                              ) : (
                                <Circle className="h-6 w-6 text-gray-400 flex-shrink-0" />
                              )}
                            </div>

                            <div className="mt-4 space-y-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Files:</h4>
                                <ul className="text-xs text-gray-600 space-y-1 bg-gray-50 rounded p-3 font-mono">
                                  {feature.files.map((file, idx) => (
                                    <li key={idx}>• {file}</li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Usage:</h4>
                                <p className="text-sm text-gray-600 bg-blue-50 rounded p-3">
                                  {feature.usage}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeSection === 'architecture' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Architecture</h2>
                    
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Directory Structure</h3>
                        <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`/app
  /api
    /keys/generate       - API key generation
    /submissions         - Submission management API
    /templates/[id]/fill - Template filling API
  /documents
    /[id]               - Document viewer
    /[id]/edit          - Template editor
  /submissions          - Submissions dashboard
  /dashboard            - Main dashboard

/components
  /auth                 - Authentication components
  /documents            - Document list & management
  /layout               - Layout components
  /submissions          - Submission modals & UI

/hooks
  /useSubmissions.ts    - Submission management hook

/lib
  /firebase.ts          - Firebase client SDK
  /firebase-admin.ts    - Firebase Admin SDK (optional)
  /fontDetection.ts     - Font analysis & capacity calc
  /pdfFiller.ts         - PDF filling utilities

/types
  /index.ts             - Core types (Document, User, etc.)
  /submission.ts        - Submission types
  /template.ts          - Template & Placeholder types

/store
  /authStore.ts         - Zustand auth state management`}
                        </pre>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Flow</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                            <div>
                              <strong className="text-gray-900">Upload:</strong> PDF → Firebase Storage → Firestore document created
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                            <div>
                              <strong className="text-gray-900">Template Creation:</strong> Add placeholders → Font analysis → Save to Firestore
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                            <div>
                              <strong className="text-gray-900">Submission:</strong> Add recipients → Create submission doc → Generate unique links
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                            <div>
                              <strong className="text-gray-900">Tracking:</strong> Real-time Firestore listeners → UI updates → Status changes
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Firestore Collections</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li><code className="bg-gray-100 px-2 py-1 rounded">documents</code> - All documents and templates</li>
                          <li><code className="bg-gray-100 px-2 py-1 rounded">submissions</code> - Submission tracking with recipients</li>
                          <li><code className="bg-gray-100 px-2 py-1 rounded">signatures</code> - User signature images</li>
                          <li><code className="bg-gray-100 px-2 py-1 rounded">api_keys</code> - API keys for external integrations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'workflows' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Workflows</h2>
                    
                    <div className="space-y-6">
                      <div className="border-l-4 border-primary-600 pl-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Workflow 1: Create & Send Template
                        </h3>
                        <ol className="space-y-3 text-sm text-gray-600">
                          <li className="flex gap-3">
                            <span className="font-semibold text-primary-600">Step 1:</span>
                            <span>Dashboard → Click "Upload Document" → Select PDF file</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-primary-600">Step 2:</span>
                            <span>Click "Template" button on uploaded document</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-primary-600">Step 3:</span>
                            <span>Add placeholders by clicking "Add Placeholder" and positioning them</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-primary-600">Step 4:</span>
                            <span>Resize placeholders (drag bottom-right corner) to see character capacity</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-primary-600">Step 5:</span>
                            <span>Click "Save Template" to make it reusable</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-primary-600">Step 6:</span>
                            <span>Click "Add Recipients" → Enter email addresses → Create Submission</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-primary-600">Step 7:</span>
                            <span>Go to Submissions tab → Track progress in real-time</span>
                          </li>
                        </ol>
                      </div>

                      <div className="border-l-4 border-green-600 pl-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Workflow 2: Clone & Modify
                        </h3>
                        <ol className="space-y-3 text-sm text-gray-600">
                          <li className="flex gap-3">
                            <span className="font-semibold text-green-600">Step 1:</span>
                            <span>Dashboard → Find template you want to duplicate</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-green-600">Step 2:</span>
                            <span>Click copy icon (📋) → New template created instantly</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-green-600">Step 3:</span>
                            <span>Click edit icon on cloned template</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-green-600">Step 4:</span>
                            <span>Modify placeholders, fonts, or add new ones</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-green-600">Step 5:</span>
                            <span>Save changes → Add recipients → Send</span>
                          </li>
                        </ol>
                      </div>

                      <div className="border-l-4 border-orange-600 pl-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Workflow 3: Archive Management
                        </h3>
                        <ol className="space-y-3 text-sm text-gray-600">
                          <li className="flex gap-3">
                            <span className="font-semibold text-orange-600">Step 1:</span>
                            <span>Dashboard → Find old/unused templates</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-orange-600">Step 2:</span>
                            <span>Click archive icon (📦) → Template archived</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-orange-600">Step 3:</span>
                            <span>Click "View Archived" toggle to see archived templates</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-orange-600">Step 4:</span>
                            <span>To restore: Click restore icon → Back to active view</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="font-semibold text-orange-600">Step 5:</span>
                            <span>To permanently delete: Click delete icon (🗑️)</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'api' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">API Reference</h2>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> API endpoints are available for external integrations with n8n, Make.com, Pabbly, WordPress, etc.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">POST</span>
                          <code className="text-sm font-mono">/api/templates/[templateId]/fill</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Fill a template with provided data via API</p>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
<pre>{`// Request
POST /api/templates/abc123/fill
Headers: {
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
Body: {
  "data": {
    "field_1": "John Doe",
    "field_2": "john@example.com",
    "field_3": "2023-11-17"
  }
}

// Response
{
  "success": true,
  "filledDocumentUrl": "https://..."
}`}</pre>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">POST</span>
                          <code className="text-sm font-mono">/api/keys/generate</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Generate API key for external integrations</p>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
<pre>{`// Request
POST /api/keys/generate
Body: {
  "userId": "user_123",
  "name": "n8n Integration"
}

// Response
{
  "success": true,
  "apiKey": "key_...",
  "expiresAt": "2024-11-17T00:00:00Z"
}`}</pre>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm font-semibold">GET</span>
                          <code className="text-sm font-mono">/api/submissions</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">List all submissions with optional filters</p>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
<pre>{`// Request
GET /api/submissions?status=completed&templateId=abc123

// Response
{
  "submissions": [
    {
      "id": "sub_123",
      "templateId": "abc123",
      "status": "completed",
      "recipients": [...],
      "createdAt": "2023-11-17T10:00:00Z"
    }
  ]
}`}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
