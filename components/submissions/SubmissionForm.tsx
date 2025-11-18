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
                    <div className="relative w-full h-full group">
                      {formData[placeholder.id] ? (
                        // Show signed signature image
                        <div 
                          className="w-full h-full border-4 border-emerald-500 bg-white rounded-lg shadow-xl overflow-hidden cursor-pointer relative animate-pulse-slow"
                          onClick={() => handleOpenSignaturePad(placeholder.id)}
                          style={{
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), 0 10px 25px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <img 
                            src={formData[placeholder.id]} 
                            alt="Signature" 
                            className="w-full h-full object-contain p-2"
                          />
                          {/* Signed Badge */}
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                            ✓ Signed
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-white text-sm font-semibold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                              <Edit3 className="w-5 h-5" />
                              Click to Re-sign
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Show sign button with enhanced design
                        <button
                          type="button"
                          onClick={() => handleOpenSignaturePad(placeholder.id)}
                          className="relative w-full h-full px-4 border-4 border-dashed border-blue-500 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 backdrop-blur-sm rounded-lg shadow-xl hover:shadow-2xl hover:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-300 flex flex-col items-center justify-center gap-2 text-blue-700 font-bold overflow-hidden group"
                          title={placeholder.label || 'Click to sign'}
                          style={{
                            boxShadow: '0 0 30px rgba(59, 130, 246, 0.2), 0 10px 25px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {/* Sparkle animations */}
                          <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                            <div className="absolute top-3 right-4 w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                            <div className="absolute bottom-4 left-6 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute bottom-3 right-3 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></div>
                          </div>
                          
                          {/* Animated pen icon */}
                          <div className="transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                            <Edit3 className="w-8 h-8 text-blue-600" />
                          </div>
                          
                          {/* Text */}
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              SIGN HERE
                            </span>
                            <span className="text-xs text-blue-600 font-medium">
                              ✍️ Click to add your signature
                            </span>
                          </div>
                          
                          {/* Bottom accent line */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 group-hover:h-2 transition-all"></div>
                          
                          {/* Required indicator */}
                          {placeholder.required && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                              Required
                            </div>
                          )}
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
