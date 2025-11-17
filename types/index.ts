export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  ownerId: string;
  ownerEmail: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  signatureFields: SignatureField[];
  signers: Signer[];
  completedAt?: Date;
  isTemplate?: boolean;
  isArchived?: boolean;
  placeholders?: any[];
  submissionCount?: number;
  lastSubmissionAt?: Date;
}

export interface SignatureField {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  signerId: string;
  isSigned: boolean;
  signatureUrl?: string;
}

export interface Signer {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'viewed' | 'signed';
  signedAt?: Date;
  signatureUrl?: string;
}

export interface Signature {
  id: string;
  userId: string;
  imageUrl: string;
  createdAt: Date;
}
