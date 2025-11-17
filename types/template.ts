export interface Placeholder {
  id: string;
  key: string; // e.g., "name", "email", "company"
  label: string; // Display name
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  maxLength?: number;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'email';
  defaultValue?: string;
  recommendedFontSize?: number; // AI-detected recommendation
  recommendedFontFamily?: string; // AI-detected recommendation
}

export interface DocumentTemplate {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  ownerId: string;
  ownerEmail: string;
  placeholders: Placeholder[];
  apiKey?: string; // For API access
  webhookUrl?: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilledDocument {
  id: string;
  templateId: string;
  title: string;
  filledData: Record<string, string>;
  generatedFileUrl: string;
  generatedFilePath: string;
  source: 'manual' | 'api' | 'webhook' | 'n8n' | 'make' | 'pabbly' | 'wordpress';
  sourceDetails?: any;
  createdAt: Date;
}

export interface APIKeyData {
  id: string;
  userId: string;
  key: string;
  name: string;
  lastUsed?: Date;
  createdAt: Date;
  isActive: boolean;
}
