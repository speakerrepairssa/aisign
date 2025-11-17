'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Document } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export const dynamicParams = true;

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!params.id) return;

      try {
        const docRef = doc(db, 'documents', params.id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDocument({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
            completedAt: docSnap.data().completedAt?.toDate(),
          } as Document);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [params.id, router]);

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

  if (!document) {
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Documents
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{document.title}</h1>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Created {format(document.createdAt, 'MMM d, yyyy')}</span>
                  <span>•</span>
                  <span className="capitalize">{document.status}</span>
                </div>
              </div>
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          </div>

          {/* Document Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">File Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{document.fileName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900">{document.ownerEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{document.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(document.updatedAt, 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
            </dl>
          </div>

          {/* PDF Viewer */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h2>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={`${document.fileUrl}#toolbar=0`}
                className="w-full h-[800px]"
                title={document.title}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
