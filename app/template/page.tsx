'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Document as DocType } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, FileText, Calendar, User, Link as LinkIcon, Archive, Copy, Edit, UserPlus, Loader2, Eye, Download, Trash2, ArchiveRestore } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSubmissions } from '@/hooks/useSubmissions';
import { format } from 'date-fns';
import AddRecipientsModal from '@/components/submissions/AddRecipientsModal';

function TemplateDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id');
  const { user } = useAuthStore();
  const [template, setTemplate] = useState<DocType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const { submissions, loading: submissionsLoading, error: submissionsError } = useSubmissions(
    templateId || undefined,
    undefined,
    user?.uid
  );

  useEffect(() => {
    if (!templateId) return;

    const fetchTemplate = async () => {
      try {
        const docRef = doc(db, 'documents', templateId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTemplate({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as DocType);
        } else {
          toast.error('Template not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        toast.error('Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, router]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/documents/${templateId}`;
    navigator.clipboard.writeText(link);
    toast.success('Template link copied!');
  };

  const handleArchive = async () => {
    if (!template || !templateId) return;
    
    try {
      await updateDoc(doc(db, 'documents', templateId), {
        isArchived: !template.isArchived,
        updatedAt: new Date(),
      });
      setTemplate({ ...template, isArchived: !template.isArchived });
      toast.success(template.isArchived ? 'Template restored!' : 'Template archived!');
    } catch (error) {
      console.error('Error archiving template:', error);
      toast.error('Failed to archive template');
    }
  };

  const handleClone = async () => {
    if (!template || !user) return;
    
    try {
      const clonedDoc = {
        ...template,
        title: `${template.title} (Copy)`,
        fileName: `${template.fileName} (Copy)`,
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
      toast.success('Template cloned successfully!');
      router.push(`/template?id=${newDocRef.id}`);
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error('Failed to clone template');
    }
  };

  const handleEdit = () => {
    router.push(`/edit-document?id=${templateId}`);
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

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!template) return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Template Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">File Name</p>
                  <p className="text-sm text-gray-900 break-words">{template.fileName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-900">{format(template.createdAt, 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    template.isArchived ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {template.isArchived ? 'Archived' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Header with Title and Actions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
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
                    {template.isArchived ? (
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
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    EDIT
                  </button>
                </div>
              </div>
            </div>

            {/* Submissions Header */}
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-4">
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

              {/* Submissions Content */}
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
                  <p className="text-sm text-gray-500 mb-4">Get started by sending this template to recipients</p>
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
          </div>          {/* Header with Title and Actions */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <LinkIcon className="h-4 w-4" />
                    LINK
                  </button>
                  <button
                    onClick={handleArchive}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {template.isArchived ? (
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
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4" />
                    CLONE
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                  >
                    <Edit className="h-4 w-4" />
                    EDIT
                  </button>
                </div>
              </div>
            </div>

            {/* Submissions Header */}
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Submissions</h2>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download className="h-4 w-4" />
                    EXPORT
                  </button>
                  <button
                    onClick={() => setShowRecipientsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                  >
                    <UserPlus className="h-4 w-4" />
                    ADD RECIPIENTS
                  </button>
                </div>
              </div>

              {/* Submissions Content */}
              {submissionsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No submissions yet</p>
                  <p className="text-sm mt-2">Click "Add Recipients" to send this template to clients</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                          submission.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          submission.status === 'completed' ? 'bg-green-100 text-green-800' :
                          submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status}
                        </span>
                        <div className="text-gray-900 font-medium">
                          {submission.recipients.map((recipient, idx) => (
                            <span key={idx}>{recipient.name || recipient.email}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (submission.status === 'completed' && submission.completedFileUrl) {
                              // Copy completed document URL
                              handleCopySubmissionLink(submission.completedFileUrl);
                            } else {
                              // Copy submission form link
                              submission.recipients[0] && handleCopySubmissionLink(submission.recipients[0].submissionLink || '');
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                        >
                          <LinkIcon className="h-4 w-4" />
                          {submission.status === 'completed' ? 'COPY DOCUMENT' : 'COPY LINK'}
                        </button>
                        <button 
                          onClick={() => {
                            if (submission.status === 'completed' && submission.completedFileUrl) {
                              // Open filled document in new tab
                              window.open(submission.completedFileUrl, '_blank');
                            } else {
                              // Open submission form for pending/sent submissions
                              const submissionLink = submission.recipients[0]?.submissionLink;
                              if (submissionLink) {
                                window.open(submissionLink, '_blank');
                              }
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          {submission.status === 'completed' ? 'VIEW DOCUMENT' : 'VIEW FORM'}
                        </button>
                        {submission.status === 'completed' && submission.completedFileUrl && (
                          <a
                            href={submission.completedFileUrl}
                            download
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Download className="h-4 w-4" />
                            DOWNLOAD
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
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
        {template && (
          <AddRecipientsModal
            templateId={template.id}
            templateName={template.title}
            isOpen={showRecipientsModal}
            onClose={() => setShowRecipientsModal(false)}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function TemplateDetailPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <TemplateDetailContent />
    </Suspense>
  );
}