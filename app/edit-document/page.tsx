'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Document as DocType } from '@/types';
import { Placeholder } from '@/types/template';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  ArrowLeft, Save, UserPlus, Loader2, Type, Calendar, Hash, Mail, 
  CheckSquare, PenTool, X, Trash2, Sparkles, Grid3x3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';
import AddRecipientsModal from '@/components/submissions/AddRecipientsModal';
import { 
  analyzePDFFonts, 
  detectFontAtPosition, 
  recommendFontSize, 
  calculateCharacterCapacity, 
  recommendPlaceholderHeight,
  type FontAnalysis 
} from '@/lib/fontDetection';

const FIELD_TYPES = [
  { type: 'text', icon: Type, label: 'Text', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' },
  { type: 'signature', icon: PenTool, label: 'Signature', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
  { type: 'date', icon: Calendar, label: 'Date', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
  { type: 'email', icon: Mail, label: 'Email', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
  { type: 'number', icon: Hash, label: 'Number', color: 'bg-pink-500', hoverColor: 'hover:bg-pink-600' },
  { type: 'checkbox', icon: CheckSquare, label: 'Checkbox', color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-600' },
] as const;

const SNAP_THRESHOLD = 5;

function EditTemplateContent() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('id');
  const router = useRouter();
  
  const [document, setDocument] = useState<DocType | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<typeof FIELD_TYPES[number] | null>(null);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [fontAnalysis, setFontAnalysis] = useState<FontAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);
  const [guideLines, setGuideLines] = useState<{ x: number[], y: number[] }>({ x: [], y: [] });
  const [isDraggingPlaceholder, setIsDraggingPlaceholder] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const [pdfHeight, setPdfHeight] = useState(1400);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return;

      try {
        const docRef = doc(db, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const docData = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as DocType;
          
          setDocument(docData);
          setPlaceholders(data.placeholders || []);
          analyzeFonts(docData.fileUrl);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        toast.error('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, router]);

  const analyzeFonts = async (fileUrl: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const analysis = await analyzePDFFonts(arrayBuffer);
      setFontAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing fonts:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateGuideLines = (currentId: string, currentX: number, currentY: number, currentWidth: number, currentHeight: number) => {
    const guides = { x: [] as number[], y: [] as number[] };
    
    placeholders.forEach(p => {
      if (p.id === currentId) return;
      if (Math.abs(p.x - currentX) < SNAP_THRESHOLD) guides.x.push(p.x);
      if (Math.abs((p.x + p.width) - (currentX + currentWidth)) < SNAP_THRESHOLD) guides.x.push(p.x + p.width);
      if (Math.abs(p.y - currentY) < SNAP_THRESHOLD) guides.y.push(p.y);
      if (Math.abs((p.y + p.height) - (currentY + currentHeight)) < SNAP_THRESHOLD) guides.y.push(p.y + p.height);
    });
    
    return guides;
  };

  const snapToGuides = (x: number, y: number, width: number, height: number) => {
    let snappedX = x;
    let snappedY = y;
    
    placeholders.forEach(p => {
      if (Math.abs(p.x - x) < SNAP_THRESHOLD) snappedX = p.x;
      if (Math.abs((p.x + p.width) - (x + width)) < SNAP_THRESHOLD) snappedX = p.x + p.width - width;
      if (Math.abs(p.y - y) < SNAP_THRESHOLD) snappedY = p.y;
      if (Math.abs((p.y + p.height) - (y + height)) < SNAP_THRESHOLD) snappedY = p.y + p.height - height;
    });
    
    return { x: snappedX, y: snappedY };
  };

  const handleFieldDragStart = (fieldType: typeof FIELD_TYPES[number]) => {
    setDraggedField(fieldType);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedField || !pdfContainerRef.current) return;

    const rect = pdfContainerRef.current.getBoundingClientRect();
    // Calculate position relative to the PDF container, not the viewport
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const defaultSizes: Record<string, { width: number, height: number }> = {
      text: { width: 200, height: 35 },
      signature: { width: 250, height: 80 },
      date: { width: 150, height: 35 },
      email: { width: 200, height: 35 },
      number: { width: 120, height: 35 },
      checkbox: { width: 25, height: 25 },
    };

    const size = defaultSizes[draggedField.type] || { width: 200, height: 35 };
    let fontSize = 11;
    let fontFamily = 'Helvetica';
    
    if (fontAnalysis) {
      const fontRec = detectFontAtPosition(x, y, fontAnalysis);
      fontSize = recommendFontSize(size.width, draggedField.type, fontRec.size);
      fontFamily = fontRec.font;
    }

    const newPlaceholder: Placeholder = {
      id: nanoid(),
      key: `${draggedField.type}_${placeholders.length + 1}`,
      label: `${draggedField.label} ${placeholders.length + 1}`,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: size.width,
      height: size.height,
      page: 1,
      type: draggedField.type as any,
      required: draggedField.type === 'signature',
      fontSize,
      fontFamily,
    };

    setPlaceholders([...placeholders, newPlaceholder]);
    setSelectedPlaceholder(newPlaceholder.id);
    setDraggedField(null);
    toast.success(`${draggedField.label} field added!`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePlaceholderMouseDown = (e: React.MouseEvent, placeholderId: string) => {
    e.stopPropagation();
    const placeholder = placeholders.find(p => p.id === placeholderId);
    if (!placeholder || !pdfContainerRef.current) return;

    setSelectedPlaceholder(placeholderId);
    setIsDraggingPlaceholder(true);
    
    const pdfRect = pdfContainerRef.current.getBoundingClientRect();
    
    // Calculate drag offset relative to PDF container only, no scroll compensation
    setDragOffset({
      x: e.clientX - pdfRect.left - placeholder.x,
      y: e.clientY - pdfRect.top - placeholder.y
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, placeholderId: string, handle: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    setSelectedPlaceholder(placeholderId);
    setIsResizing(true);
    setResizeHandle(handle);
    
    const placeholder = placeholders.find(p => p.id === placeholderId);
    if (!placeholder || !pdfContainerRef.current) return;
    
    const pdfRect = pdfContainerRef.current.getBoundingClientRect();
    
    // Remove scroll compensation for resize operations
    setDragOffset({
      x: e.clientX - pdfRect.left,
      y: e.clientY - pdfRect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedPlaceholder || !pdfContainerRef.current) return;
    if (!isDraggingPlaceholder && !isResizing) return;

    const rect = pdfContainerRef.current.getBoundingClientRect();
    
    const placeholder = placeholders.find(p => p.id === selectedPlaceholder);
    if (!placeholder) return;

    if (isDraggingPlaceholder) {
      // Calculate position relative to PDF container only, no scroll compensation
      let newX = e.clientX - rect.left - dragOffset.x;
      let newY = e.clientY - rect.top - dragOffset.y;

      if (showAlignmentGuides) {
        const snapped = snapToGuides(newX, newY, placeholder.width, placeholder.height);
        newX = snapped.x;
        newY = snapped.y;
        const guides = calculateGuideLines(selectedPlaceholder, newX, newY, placeholder.width, placeholder.height);
        setGuideLines(guides);
      }

      newX = Math.max(0, Math.min(newX, rect.width - placeholder.width));
      newY = Math.max(0, newY);

      updatePlaceholder(selectedPlaceholder, { x: newX, y: newY });
    } else if (isResizing && resizeHandle) {
      // Remove scroll compensation for resize calculations  
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let newWidth = placeholder.width;
      let newHeight = placeholder.height;
      let newX = placeholder.x;
      let newY = placeholder.y;

      if (resizeHandle === 'se') {
        newWidth = Math.max(30, mouseX - placeholder.x);
        newHeight = Math.max(20, mouseY - placeholder.y);
      } else if (resizeHandle === 'sw') {
        newWidth = Math.max(30, placeholder.x + placeholder.width - mouseX);
        newHeight = Math.max(20, mouseY - placeholder.y);
        newX = Math.min(mouseX, placeholder.x + placeholder.width - 30);
      } else if (resizeHandle === 'ne') {
        newWidth = Math.max(30, mouseX - placeholder.x);
        newHeight = Math.max(20, placeholder.y + placeholder.height - mouseY);
        newY = Math.min(mouseY, placeholder.y + placeholder.height - 20);
      } else if (resizeHandle === 'nw') {
        newWidth = Math.max(30, placeholder.x + placeholder.width - mouseX);
        newHeight = Math.max(20, placeholder.y + placeholder.height - mouseY);
        newX = Math.min(mouseX, placeholder.x + placeholder.width - 30);
        newY = Math.min(mouseY, placeholder.y + placeholder.height - 20);
      }

      updatePlaceholder(selectedPlaceholder, { 
        x: newX, 
        y: newY, 
        width: newWidth, 
        height: newHeight 
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingPlaceholder(false);
    setIsResizing(false);
    setResizeHandle(null);
    setGuideLines({ x: [], y: [] });
  };

  const updatePlaceholder = (id: string, updates: Partial<Placeholder>) => {
    setPlaceholders(placeholders.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePlaceholder = (id: string) => {
    setPlaceholders(placeholders.filter(p => p.id !== id));
    if (selectedPlaceholder === id) setSelectedPlaceholder(null);
    toast.success('Field deleted');
  };

  const getCharacterCapacity = (placeholder: Placeholder) => {
    return calculateCharacterCapacity(
      placeholder.width,
      placeholder.height,
      placeholder.fontSize || 11,
      placeholder.fontFamily || 'Helvetica'
    );
  };

  const applyRecommendedHeight = (placeholder: Placeholder) => {
    const recHeight = recommendPlaceholderHeight(placeholder.fontSize || 11, 1);
    updatePlaceholder(placeholder.id, { height: recHeight });
    toast.success(`Height adjusted to ${recHeight}px`);
  };

  const savePlaceholders = async () => {
    if (!document || !documentId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'documents', documentId), {
        placeholders,
        updatedAt: new Date(),
      });
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!document) return null;

  const selectedField = placeholders.find(p => p.id === selectedPlaceholder);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-bold">{document.title}</h1>
            {isAnalyzing && (
              <span className="text-sm text-blue-600 flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Analyzing...
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAlignmentGuides(!showAlignmentGuides)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                showAlignmentGuides ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              Guides {showAlignmentGuides ? 'ON' : 'OFF'}
            </button>
            {document?.isTemplate && (
              <button onClick={() => setShowRecipientsModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <UserPlus className="h-4 w-4" />
                Send
              </button>
            )}
            <button
              onClick={savePlaceholders}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 bg-white border-r overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase mb-4">Field Types</h2>
              <div className="space-y-2">
                {FIELD_TYPES.map((fieldType) => {
                  const Icon = fieldType.icon;
                  return (
                    <div
                      key={fieldType.type}
                      draggable
                      onDragStart={() => handleFieldDragStart(fieldType)}
                      className={`${fieldType.color} ${fieldType.hoverColor} text-white rounded-lg p-3 cursor-move transform hover:scale-105 shadow-md`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold">{fieldType.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <strong>💡 Drag and drop</strong> fields onto the document.
                  <br /><br />
                  <strong>🎯 Click and drag</strong> to reposition.
                </p>
              </div>
            </div>
          </div>

          <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="p-8">
              <div
                ref={pdfContainerRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`relative bg-white shadow-2xl rounded-lg max-w-4xl mx-auto ${draggedField ? 'ring-4 ring-blue-400' : ''}`}
              >
                <iframe
                  src={`${document.fileUrl}#toolbar=0&navpanes=0`}
                  className="w-full pointer-events-none"
                  style={{ height: `${pdfHeight}px` }}
                  title="Document"
                  onLoad={(e) => {
                    // Try to detect PDF height - default to tall enough for multi-page docs
                    const iframe = e.currentTarget;
                    try {
                      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (iframeDoc) {
                        const height = iframeDoc.body?.scrollHeight || 3000;
                        setPdfHeight(Math.max(height, 3000));
                      } else {
                        setPdfHeight(3000); // Default to 3000px for multi-page PDFs
                      }
                    } catch (error) {
                      // Cross-origin restrictions - use safe default
                      setPdfHeight(3000);
                    }
                  }}
                />

                {showAlignmentGuides && isDraggingPlaceholder && (
                  <div className="absolute inset-0 pointer-events-none z-40">
                    {guideLines.x.map((x, i) => (
                      <div key={`v-${i}`} className="absolute top-0 bottom-0 bg-blue-500" style={{ left: `${x}px`, width: '1px', opacity: 0.6 }} />
                    ))}
                    {guideLines.y.map((y, i) => (
                      <div key={`h-${i}`} className="absolute left-0 right-0 bg-red-500" style={{ top: `${y}px`, height: '1px', opacity: 0.6 }} />
                    ))}
                  </div>
                )}

                <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ minHeight: `${pdfHeight}px` }}>
                  {placeholders.map((placeholder) => {
                    const fieldType = FIELD_TYPES.find(ft => ft.type === placeholder.type);
                    const Icon = fieldType?.icon || Type;
                    const isSelected = selectedPlaceholder === placeholder.id;

                    return (
                      <div
                        key={placeholder.id}
                        className={`absolute pointer-events-auto cursor-move group ${isSelected ? 'ring-4 ring-blue-500 shadow-2xl z-30' : 'shadow-lg z-20'}`}
                        style={{
                          left: `${placeholder.x}px`,
                          top: `${placeholder.y}px`,
                          width: `${placeholder.width}px`,
                          height: `${placeholder.height}px`,
                        }}
                        onMouseDown={(e) => handlePlaceholderMouseDown(e, placeholder.id)}
                        onClick={() => setSelectedPlaceholder(placeholder.id)}
                      >
                        <div className={`w-full h-full ${fieldType?.color} bg-opacity-20 border-3 ${isSelected ? 'border-blue-600' : 'border-gray-400'} rounded flex items-center justify-center`}>
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="text-xs font-semibold">{placeholder.label}</span>
                        </div>
                        {isSelected && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); deletePlaceholder(placeholder.id); }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-50"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {/* Resize handles */}
                            <div
                              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 rounded-full cursor-se-resize z-50"
                              onMouseDown={(e) => { e.stopPropagation(); handleResizeMouseDown(e, placeholder.id, 'se'); }}
                            />
                            <div
                              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-600 rounded-full cursor-sw-resize z-50"
                              onMouseDown={(e) => { e.stopPropagation(); handleResizeMouseDown(e, placeholder.id, 'sw'); }}
                            />
                            <div
                              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full cursor-ne-resize z-50"
                              onMouseDown={(e) => { e.stopPropagation(); handleResizeMouseDown(e, placeholder.id, 'ne'); }}
                            />
                            <div
                              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 rounded-full cursor-nw-resize z-50"
                              onMouseDown={(e) => { e.stopPropagation(); handleResizeMouseDown(e, placeholder.id, 'nw'); }}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {draggedField && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-4 border-dashed border-blue-400 rounded-lg flex items-center justify-center pointer-events-none z-50">
                    <div className="bg-white px-6 py-4 rounded-lg shadow-xl">
                      <p className="text-blue-600 font-bold">Drop {draggedField.label} field here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-80 bg-white border-l overflow-y-auto">
            <div className="p-4">
              {selectedField ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Properties</h2>
                    <button onClick={() => setSelectedPlaceholder(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Label</label>
                      <input
                        type="text"
                        value={selectedField.label}
                        onChange={(e) => updatePlaceholder(selectedField.id, { label: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Key</label>
                      <input
                        type="text"
                        value={selectedField.key}
                        onChange={(e) => updatePlaceholder(selectedField.id, { key: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedField.required}
                        onChange={(e) => updatePlaceholder(selectedField.id, { required: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Required</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium mb-1 flex justify-between">
                        <span>Font Size</span>
                        {fontAnalysis && (
                          <span className="text-xs text-purple-600 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI: {fontAnalysis.recommendedSize}pt
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={selectedField.fontSize || 11}
                        onChange={(e) => updatePlaceholder(selectedField.id, { fontSize: parseInt(e.target.value) || 11 })}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="6"
                        max="72"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex justify-between mb-2 text-xs">
                        <span>Recommended Height:</span>
                        <span className="font-bold text-blue-700">{recommendPlaceholderHeight(selectedField.fontSize || 11, 1)}px</span>
                      </div>
                      <button
                        onClick={() => applyRecommendedHeight(selectedField)}
                        className="w-full text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Apply Recommended
                      </button>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="text-xs font-medium mb-2">Character Capacity:</div>
                      {(() => {
                        const capacity = getCharacterCapacity(selectedField);
                        return (
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span className="font-bold text-purple-700">~{capacity.capacity} chars</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Per Line:</span>
                              <span>~{capacity.charsPerLine} chars</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Width</label>
                        <input
                          type="number"
                          value={Math.round(selectedField.width)}
                          onChange={(e) => updatePlaceholder(selectedField.id, { width: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Height</label>
                        <input
                          type="number"
                          value={Math.round(selectedField.height)}
                          onChange={(e) => updatePlaceholder(selectedField.id, { height: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => deletePlaceholder(selectedField.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Field
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Type className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">No field selected</p>
                  <p className="text-sm text-gray-500 mt-2">Drag a field or click one to edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {document && (
        <AddRecipientsModal
          templateId={document.id}
          templateName={document.title}
          isOpen={showRecipientsModal}
          onClose={() => setShowRecipientsModal(false)}
        />
      )}
    </ProtectedRoute>
  );
}

export default function EditDocumentPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    }>
      <EditTemplateContent />
    </Suspense>
  );
}
