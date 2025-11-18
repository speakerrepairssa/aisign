'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateRecipientStatus } from '@/hooks/useSubmissions';
import { Submission } from '@/types/submission';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';
import SubmissionForm from '@/components/submissions/SubmissionForm';

function SubmitContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id');
  const token = searchParams.get('token');
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<any>(null);

  useEffect(() => {
    if (!submissionId || !token) {
      setError('Invalid submission link');
      setLoading(false);
      return;
    }

    loadSubmission();
  }, [submissionId, token]);

  const loadSubmission = async () => {
    try {
      console.log('Loading submission:', submissionId, 'with token:', token);
      const submissionRef = doc(db, 'submissions', submissionId!);
      const submissionSnap = await getDoc(submissionRef);

      console.log('Submission exists:', submissionSnap.exists());

      if (!submissionSnap.exists()) {
        console.error('Submission not found in Firestore');
        setError('Submission not found');
        setLoading(false);
        return;
      }

      const submissionData = {
        id: submissionSnap.id,
        ...submissionSnap.data(),
        createdAt: submissionSnap.data().createdAt?.toDate(),
        updatedAt: submissionSnap.data().updatedAt?.toDate(),
      } as Submission;

      console.log('Submission data:', {
        id: submissionData.id,
        templateId: submissionData.templateId,
        recipientCount: submissionData.recipients?.length,
      });

      // Find the recipient with this token
      console.log('Recipients:', submissionData.recipients);
      console.log('Looking for token:', token);
      const foundRecipient = submissionData.recipients.find(
        (r) => r.submissionLink?.includes(token!)
      );

      console.log('Found recipient:', foundRecipient);

      if (!foundRecipient) {
        console.error('No recipient found with this token');
        setError('Invalid submission token');
        setLoading(false);
        return;
      }

      setSubmission(submissionData);
      setRecipient(foundRecipient);

      // Mark as opened if not already
      if (foundRecipient.status === 'sent' || foundRecipient.status === 'pending') {
        await updateRecipientStatus(submissionId!, foundRecipient.id, 'opened');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading submission:', err);
      setError('Failed to load submission');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!submission || !recipient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {submission.templateName}
              </h1>
              <p className="text-gray-600">
                Hello {recipient.name}, please review and sign this document.
              </p>
            </div>
            {recipient.status === 'completed' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Document Viewer & Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {recipient.status === 'completed' ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Thank You!
              </h2>
              <p className="text-gray-600">
                You have already completed this document.
              </p>
            </div>
          ) : (
            <SubmissionForm 
              submission={submission}
              recipient={recipient}
              submissionId={submissionId!}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        </div>
      }
    >
      <SubmitContent />
    </Suspense>
  );
}
