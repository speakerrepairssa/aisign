'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';
import { Plus, X } from 'lucide-react';

export default function DashboardPage() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
                <p className="mt-2 text-gray-600">
                  Manage and track all your documents in one place
                </p>
              </div>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                {showUpload ? (
                  <>
                    <X className="h-5 w-5" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Upload New Document
                </h2>
                <DocumentUpload
                  onUploadComplete={() => {
                    setShowUpload(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* Documents List */}
          <DocumentList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
