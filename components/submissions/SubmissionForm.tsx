'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Submission, Recipient } from '@/types/submission';
import { Loader2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateRecipientStatus } from '@/hooks/useSubmissions';
import SignaturePadModal from './SignaturePadModal';

interface SubmissionFormProps {
  submission: Submission;
  recipient: Recipient;
  submissionId: string;
}

interface Template {
  id: string;
  pdfUrl: string;
  placeholders: any[];
  title: string;
}

export default function SubmissionForm({ submission, recipient, submissionId }: SubmissionFormProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [submission]);

  const loadTemplate = async () => {
    try {
      console.log('Loading template data from submission');
      
      // First, try to use the embedded template data in the submission
      if (submission.templateData) {
        console.log('Using embedded template data');
        const templateData = {
          id: submission.templateId,
          title: submission.templateData.title,
          pdfUrl: submission.templateData.pdfUrl,
          placeholders: submission.templateData.placeholders,
        } as Template;

        console.log('Template loaded from submission:', templateData.title);
        console.log('PDF URL:', templateData.pdfUrl);
        console.log('Placeholders:', templateData.placeholders?.length || 0);

        setTemplate(templateData);

        // Initialize form data with empty values for each placeholder
        const initialData: Record<string, string> = {};
        templateData.placeholders?.forEach((placeholder: any) => {
          initialData[placeholder.id] = '';
        });
        setFormData(initialData);

        setLoading(false);
        return;
      }

      // Fallback: try to load from documents collection (for old submissions)
      console.log('No embedded template data, fetching from Firestore. Template ID:', submission.templateId);
      const templateRef = doc(db, 'documents', submission.templateId);
      const templateSnap = await getDoc(templateRef);

      console.log('Template exists in documents collection:', templateSnap.exists());
      
      if (!templateSnap.exists()) {
        console.error('Template not found in Firestore. Template ID:', submission.templateId);
        toast.error('Template not found. Please contact the sender.');
        setLoading(false);
        return;
      }

      const templateData = {
        id: templateSnap.id,
        ...templateSnap.data(),
      } as Template;

      console.log('Template loaded from documents:', templateData.title);
      console.log('PDF URL:', templateData.pdfUrl);
      console.log('Placeholders:', templateData.placeholders?.length || 0);

      setTemplate(templateData);

      // Initialize form data with empty values for each placeholder
      const initialData: Record<string, string> = {};
      templateData.placeholders?.forEach((placeholder: any) => {
        initialData[placeholder.id] = '';
      });
      setFormData(initialData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template. Please try again.');
      setLoading(false);
    }
  };

  const handleOpenSignaturePad = (fieldId: string) => {
    setCurrentSignatureField(fieldId);
    setShowSignaturePad(true);
  };

  const handleSaveSignature = (signatureDataUrl: string) => {
    if (currentSignatureField) {
      setFormData({
        ...formData,
        [currentSignatureField]: signatureDataUrl,
      });
      setCurrentSignatureField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields are filled
    const emptyFields = template?.placeholders?.filter(
      (p: any) => p.required && !formData[p.id]
    );

    if (emptyFields && emptyFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Update submission with filled data
      const submissionRef = doc(db, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        filledData: formData,
        updatedAt: new Date(),
      });

      // Update recipient status to completed
      await updateRecipientStatus(submissionId, recipient.id, 'completed');

      toast.success('Document submitted successfully!');
      
      // Reload to show completion message
      window.location.reload();
    } catch (error) {
      console.error('Error submitting document:', error);
      toast.error('Failed to submit document');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading document...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Template Not Found</h3>
          <p className="text-red-700 mb-4">
            The document template (ID: {submission.templateId}) could not be found. 
            It may have been deleted by the sender.
          </p>
          <p className="text-sm text-red-600">
            Please contact the sender to request a new invitation link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Instructions:</strong> Click on the highlighted fields in the document below to fill them in. 
          All required fields must be completed before you can submit.
        </p>
      </div>

      {/* PDF Viewer with Overlaid Interactive Fields */}
      {template.pdfUrl && (
        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
          {/* PDF Background */}
          <iframe
            src={`${template.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-[842px] border-0" 
            title="Document Preview"
          />
          
          {/* Overlay container with interactive fields */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {template.placeholders && template.placeholders.map((placeholder: any) => {
              const fieldStyle = {
                left: `${placeholder.x}px`,
                top: `${placeholder.y}px`,
                width: `${placeholder.width}px`,
                height: `${placeholder.height}px`,
              };

              return (
                <div
                  key={placeholder.id}
                  className="absolute pointer-events-auto"
                  style={fieldStyle}
                >
                  {placeholder.type === 'signature' ? (
                    <div className="relative w-full h-full">
                      {formData[placeholder.id] ? (
                        // Show signed signature image
                        <div 
                          className="w-full h-full border-3 border-blue-500 bg-white rounded shadow-lg overflow-hidden cursor-pointer group"
                          onClick={() => handleOpenSignaturePad(placeholder.id)}
                        >
                          <img 
                            src={formData[placeholder.id]} 
                            alt="Signature" 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-white text-sm flex items-center gap-2">
                              <Edit3 className="w-4 h-4" />
                              Click to change
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Show sign button
                        <button
                          type="button"
                          onClick={() => handleOpenSignaturePad(placeholder.id)}
                          className="w-full h-full px-3 border-3 border-blue-500 bg-blue-50/90 backdrop-blur-sm rounded shadow-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors flex items-center justify-center gap-2 text-blue-700 font-semibold"
                          title={placeholder.label || 'Click to sign'}
                        >
                          <Edit3 className="w-5 h-5" />
                          <span style={{ fontSize: `${Math.min(placeholder.height * 0.4, 16)}px` }}>
                            Click to Sign
                          </span>
                        </button>
                      )}
                    </div>
                  ) : placeholder.type === 'date' ? (
                    <input
                      type="date"
                      value={formData[placeholder.id] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [placeholder.id]: e.target.value,
                      })}
                      className="w-full h-full px-3 border-3 border-green-500 bg-green-50/90 backdrop-blur-sm rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                      required={placeholder.required}
                      title={placeholder.label || 'Date'}
                      style={{ fontSize: `${Math.min(placeholder.height * 0.4, 16)}px` }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[placeholder.id] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [placeholder.id]: e.target.value,
                      })}
                      placeholder={placeholder.label || '📝 Enter text'}
                      className="w-full h-full px-3 border-3 border-purple-500 bg-purple-50/90 backdrop-blur-sm rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                      required={placeholder.required}
                      title={placeholder.label || 'Text field'}
                      style={{ fontSize: `${Math.min(placeholder.height * 0.4, 16)}px` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Field Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded"></div>
          <span className="text-gray-700">Signature Field</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-500 bg-green-50 rounded"></div>
          <span className="text-gray-700">Date Field</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500 bg-purple-50 rounded"></div>
          <span className="text-gray-700">Text Field</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Document'
          )}
        </button>
      </div>

      {/* Signature Pad Modal */}
      <SignaturePadModal
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={handleSaveSignature}
        label="Draw your signature using your mouse or touch screen"
      />
    </form>
  );
}
