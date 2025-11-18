'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Document as DocType } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Link as LinkIcon, Archive, Copy, Edit, UserPlus, Loader2, Eye, Download, Trash2, MoreVertical, ArchiveRestore } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'opened' | 'completed'>('all');
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const { submissions, loading: submissionsLoading } = useSubmissions(
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
    const link = `${window.location.origin}/view-document?id=${templateId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const handleArchive = async () => {
    if (!template) return;
    
    try {
      await updateDoc(doc(db, 'documents', template.id), {
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

  const filteredSubmissions = submissions.filter(sub => {
    if (statusFilter === 'all') return true;
    return sub.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      opened: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </button>

          {/* Template Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{template.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge('default')}`}>
                    {template.isArchived ? 'Archived' : 'Default'}
                  </span>
                  <span>Created {format(template.createdAt, 'MMM dd, yyyy')}</span>
                  {template.isTemplate && (
                    <span className="text-purple-600 font-medium">Template</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  LINK
                </button>
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {template.isArchived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      RESTORE
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
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  CLONE
                </button>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  EDIT
                </button>
              </div>
            </div>
          </div>

          {/* Submissions Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  EXPORT
                </button>
                <button
                  onClick={() => setShowRecipientsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <UserPlus className="h-4 w-4" />
                  ADD RECIPIENTS
                </button>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  statusFilter === 'all'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {submissions.length}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  statusFilter === 'pending'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {submissions.filter(s => s.status === 'pending').length}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  statusFilter === 'completed'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {submissions.filter(s => s.status === 'completed').length}
                </span>
              </button>
            </div>

            {/* Submissions List */}
            {submissionsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No submissions yet</p>
                <p className="text-sm mt-2">Click "Add Recipients" to send this template to clients</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusBadge(submission.status)}`}>
                        {submission.status}
                      </span>
                      <div>
                        {submission.recipients.map((recipient, idx) => (
                          <div key={idx} className="font-medium text-gray-900">
                            {recipient.name || recipient.email}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {submission.status === 'completed' ? (
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                          <Download className="h-4 w-4" />
                          DOWNLOAD
                        </button>
                      ) : (
                        <button
                          onClick={() => submission.recipients[0] && handleCopySubmissionLink(submission.recipients[0].submissionLink || '')}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                        >
                          <LinkIcon className="h-4 w-4" />
                          COPY LINK
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const submissionLink = submission.recipients[0]?.submissionLink;
                          if (submissionLink) {
                            window.open(submissionLink, '_blank');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        VIEW
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(submission.id)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Trash2 className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredSubmissions.length > 0 && (
              <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
                <span>1-{Math.min(10, filteredSubmissions.length)} of {filteredSubmissions.length} submissions</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border rounded hover:bg-gray-50">PAGE 1</button>
                  <button className="px-3 py-1 border rounded hover:bg-gray-50">»</button>
                </div>
              </div>
            )}
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
