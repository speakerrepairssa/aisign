import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission, Recipient, SubmissionStatus } from '@/types/submission';
import { nanoid } from 'nanoid';

export function useSubmissions(templateId?: string, statusFilter?: SubmissionStatus, userId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no userId provided, can't fetch submissions due to security rules
    if (!userId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'submissions'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (templateId) {
      q = query(
        collection(db, 'submissions'),
        where('createdBy', '==', userId),
        where('templateId', '==', templateId),
        orderBy('createdAt', 'desc')
      );
    }

    if (statusFilter) {
      q = query(q, where('status', '==', statusFilter));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            createdAt: docData.createdAt?.toDate() || new Date(),
            updatedAt: docData.updatedAt?.toDate() || new Date(),
            completedAt: docData.completedAt?.toDate(),
          } as Submission;
        });
        setSubmissions(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching submissions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [templateId, statusFilter, userId]);

  return { submissions, loading, error };
}

export async function createSubmission(
  templateId: string,
  recipients: Array<{ email: string; name: string }>,
  userId: string
): Promise<Submission> {
  // Get template details
  const templateRef = doc(db, 'documents', templateId);
  const templateSnap = await getDoc(templateRef);

  if (!templateSnap.exists()) {
    throw new Error('Template not found');
  }

  const templateData = templateSnap.data();
  const now = new Date();
  const submissionId = nanoid();

  const recipientsList: Recipient[] = recipients.map((recipient) => {
    const token = nanoid(16);
    return {
      id: nanoid(),
      email: recipient.email,
      name: recipient.name || recipient.email,
      status: 'pending' as SubmissionStatus,
      submissionLink: `${window.location.origin}/submit?id=${submissionId}&token=${token}`,
    };
  });

  const submission: Omit<Submission, 'id'> = {
    templateId,
    templateName: templateData.title || 'Untitled Template',
    recipients: recipientsList,
    status: 'pending',
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    // Store a complete copy of the template data in the submission
    // This ensures the submission is independent and won't break if the template is deleted/modified
    templateData: {
      title: templateData.title || 'Untitled Template',
      pdfUrl: templateData.fileUrl || '', // The field is called 'fileUrl' in templates
      placeholders: templateData.placeholders || [],
      pages: templateData.pages || 1,
      description: templateData.description || '',
    },
  };

  // Use setDoc with the generated submissionId instead of addDoc
  const docRef = doc(db, 'submissions', submissionId);
  await setDoc(docRef, submission);

  // Update template submission count
  await updateDoc(templateRef, {
    submissionCount: increment(1),
    lastSubmissionAt: now,
  });

  return {
    id: submissionId,
    ...submission,
  };
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  await updateDoc(submissionRef, {
    status,
    updatedAt: new Date(),
    ...(status === 'completed' && { completedAt: new Date() }),
  });
}

export async function updateRecipientStatus(
  submissionId: string,
  recipientId: string,
  status: SubmissionStatus
): Promise<void> {
  const submissionRef = doc(db, 'submissions', submissionId);
  const submissionSnap = await getDoc(submissionRef);

  if (!submissionSnap.exists()) {
    throw new Error('Submission not found');
  }

  const submissionData = submissionSnap.data();
  const recipients = submissionData.recipients || [];

  const updatedRecipients = recipients.map((r: Recipient) => {
    if (r.id === recipientId) {
      return {
        ...r,
        status,
        ...(status === 'sent' && !r.sentAt && { sentAt: new Date() }),
        ...(status === 'opened' && !r.openedAt && { openedAt: new Date() }),
        ...(status === 'completed' && !r.completedAt && { completedAt: new Date() }),
        ...(status === 'declined' && !r.declinedAt && { declinedAt: new Date() }),
      };
    }
    return r;
  });

  // Update overall submission status
  const allCompleted = updatedRecipients.every((r: Recipient) => r.status === 'completed');
  const anyDeclined = updatedRecipients.some((r: Recipient) => r.status === 'declined');
  const anySent = updatedRecipients.some((r: Recipient) => r.status === 'sent' || r.status === 'opened' || r.status === 'completed');

  let overallStatus: SubmissionStatus = 'pending';
  if (allCompleted) {
    overallStatus = 'completed';
  } else if (anyDeclined) {
    overallStatus = 'declined';
  } else if (anySent) {
    overallStatus = 'sent';
  }

  await updateDoc(submissionRef, {
    recipients: updatedRecipients,
    status: overallStatus,
    updatedAt: new Date(),
    ...(overallStatus === 'completed' && !submissionData.completedAt && { completedAt: new Date() }),
  });
}
