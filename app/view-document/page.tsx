'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, deleteDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Document as DocumentType } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Loader2, FileText, Calendar, User, AlertCircle, ArrowLeft, Download, UserPlus, Link as LinkIcon, Eye, Trash2, Edit, Archive, Copy, ArchiveRestore } from 'lucide-react';
import { format } from 'date-fns';
import { useSubmissions } from '@/hooks/useSubmissions';
import AddRecipientsModal from '@/components/submissions/AddRecipientsModal';
import toast from 'react-hot-toast';

function ViewDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('id');
  const { user } = useAuthStore();
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  
  const { submissions, loading: submissionsLoading } = useSubmissions(
    documentId || undefined,
    undefined,
    user?.uid
  );

  useEffect(() => {
    if (!documentId) {
      setError('No document ID provided');
      setLoading(false);
      return;
    }

    loadDocument();
  }, [documentId, user]);

  const loadDocument = async () => {
    if (!documentId || !user) return;

    try {
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Document not found');
        return;
      }

      const data = docSnap.data();
      
      // Check if user owns this document
      if (data.ownerId !== user.uid) {
        setError('You do not have permission to view this document');
        return;
      }

      setDocument({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
      } as DocumentType);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySubmissionLink = (submissionLink: string) => {
    navigator.clipboard.writeText(submissionLink);
    toast.success('Submission link copied!');
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    try {
      await deleteDoc(doc(db, 'submissions', submissionId));
      toast.success('Submission deleted');
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/documents/${document?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Document link copied!');
  };

  const handleArchive = async () => {
    if (!document || !documentId) return;
    
    try {
      await updateDoc(doc(db, 'documents', documentId), {
        isArchived: !document.isArchived,
        updatedAt: new Date(),
      });
      setDocument({ ...document, isArchived: !document.isArchived });
      toast.success(document.isArchived ? 'Document restored!' : 'Document archived!');
    } catch (error) {
      console.error('Error archiving document:', error);
      toast.error('Failed to archive document');
    }
  };

  const handleClone = async () => {
    if (!document || !user) return;
    
    try {
      const clonedDoc = {
        ...document,
        title: `${document.title} (Copy)`,
        fileName: `${document.fileName} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: user.uid,
        ownerEmail: user.email || '',
        status: 'draft',
        completedAt: null,
      };
      
      // Remove the id field
      const { id, ...docWithoutId } = clonedDoc;
      
      const newDocRef = await addDoc(collection(db, 'documents'), docWithoutId);
      toast.success('Document cloned successfully!');
      router.push(`/view-document?id=${newDocRef.id}`);
    } catch (error) {
      console.error('Error cloning document:', error);
      toast.error('Failed to clone document');
    }
  };

  if (!documentId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Request</h2>
              <p className="text-gray-600 mb-4">No document ID provided</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading document...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !document) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Documents
            </button>
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  LINK
                </button>
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {document.isArchived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      ARCHIVE
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      ARCHIVE
                    </>
                  )}
                </button>
                <button
                  onClick={handleClone}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  CLONE
                </button>
                <button
                  onClick={() => router.push(`/edit-document?id=${document.id}`)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  EDIT
                </button>
              </div>
            </div>
          </div>

          {/* Document Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">File Name</p>
                  <p className="text-sm text-gray-900 break-words">{document.fileName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-900">
                    {format(document.createdAt, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    document.isArchived ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {document.isArchived ? 'Archived' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Submissions</h2>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <Download className="h-4 w-4" />
                    EXPORT
                  </button>
                  <button
                    onClick={() => setShowRecipientsModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    ADD RECIPIENTS
                  </button>
                </div>
              </div>
            </div>

            {/* Submissions Content */}
            <div className="p-6">
              {submissionsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No submissions yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Get started by sending this document to recipients</p>
                  <button
                    onClick={() => setShowRecipientsModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Recipients
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          submission.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          submission.status === 'completed' ? 'bg-green-100 text-green-800' :
                          submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          submission.status === 'opened' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status}
                        </span>
                        <div className="font-medium text-gray-900">
                          {submission.recipients.map((recipient, idx) => (
                            <span key={idx}>{recipient.name || recipient.email}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (submission.status === 'completed' && submission.completedFileUrl) {
                              handleCopySubmissionLink(submission.completedFileUrl);
                            } else {
                              submission.recipients[0] && handleCopySubmissionLink(submission.recipients[0].submissionLink || '');
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                        >
                          <LinkIcon className="h-3 w-3" />
                          {submission.status === 'completed' ? 'COPY DOCUMENT' : 'COPY LINK'}
                        </button>
                        <button 
                          onClick={() => {
                            if (submission.status === 'completed' && submission.completedFileUrl) {
                              window.open(submission.completedFileUrl, '_blank');
                            } else {
                              const submissionLink = submission.recipients[0]?.submissionLink;
                              if (submissionLink) {
                                window.open(submissionLink, '_blank');
                              }
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          {submission.status === 'completed' ? 'VIEW DOCUMENT' : 'VIEW FORM'}
                        </button>
                        {submission.status === 'completed' && submission.completedFileUrl && (
                          <a
                            href={submission.completedFileUrl}
                            download
                            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            DOWNLOAD
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 border border-gray-300 rounded-md hover:border-red-300 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Recipients Modal */}
        {document && (
          <AddRecipientsModal
            templateId={document.id}
            templateName={document.title}
            isOpen={showRecipientsModal}
            onClose={() => setShowRecipientsModal(false)}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function ViewDocumentPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <ViewDocumentContent />
    </Suspense>
  );
}
