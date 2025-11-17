export type SubmissionStatus = 'pending' | 'sent' | 'opened' | 'completed' | 'declined';

export interface Recipient {
  id: string;
  email: string;
  name: string;
  status: SubmissionStatus;
  sentAt?: Date;
  openedAt?: Date;
  completedAt?: Date;
  declinedAt?: Date;
  submissionLink?: string;
}

export interface Submission {
  id: string;
  templateId: string;
  templateName: string;
  recipients: Recipient[];
  status: SubmissionStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  filledData?: Record<string, any>;
  completedFileUrl?: string;
  metadata?: Record<string, any>;
}

export interface SubmissionLink {
  id: string;
  templateId: string;
  token: string;
  expiresAt?: Date;
  createdAt: Date;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
}
