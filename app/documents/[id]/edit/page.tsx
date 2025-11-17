'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Document as DocType } from '@/types';
import { Placeholder } from '@/types/template';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Plus, Save, Trash2, Move, GripVertical, UserPlus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';
import { analyzePDFFonts, detectFontAtPosition, recommendFontSize, calculateCharacterCapacity, recommendPlaceholderHeight, type FontAnalysis } from '@/lib/fontDetection';
import AddRecipientsModal from '@/components/submissions/AddRecipientsModal';

export const dynamicParams = true;

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<DocType | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [fontAnalysis, setFontAnalysis] = useState<FontAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);
  const [guideLines, setGuideLines] = useState<{ x: number[], y: number[] }>({ x: [], y: [] });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!params.id) return;

      try {
        const docRef = doc(db, 'documents', params.id as string);
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
          
          // Analyze PDF fonts
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
  }, [params.id, router]);

  const analyzeFonts = async (fileUrl: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const analysis = await analyzePDFFonts(arrayBuffer);
      setFontAnalysis(analysis);
      toast.success(`Font analysis complete! Detected ${analysis.detectedFonts.length} font styles.`);
    } catch (error) {
      console.error('Error analyzing fonts:', error);
      toast.error('Could not analyze PDF fonts');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addPlaceholder = () => {
    // Get smart recommendations from font analysis
    let recommendedFontSize = 11;
    let recommendedFont = 'Helvetica';
    let recommendedHeight = 30;
    
    if (fontAnalysis) {
      const recommendation = detectFontAtPosition(100, 100, fontAnalysis);
      recommendedFontSize = recommendFontSize(200, 'text', recommendation.size);
      recommendedFont = recommendation.font;
      // Calculate recommended height based on font size
      recommendedHeight = recommendPlaceholderHeight(recommendedFontSize, 1, true);
    }
    
    const newPlaceholder: Placeholder = {
      id: nanoid(),
      key: `field_${placeholders.length + 1}`,
      label: `Field ${placeholders.length + 1}`,
      x: 100,
      y: 100,
      width: 200,
      height: recommendedHeight,
      page: 1,
      fontSize: recommendedFontSize,
      fontFamily: recommendedFont,
      align: 'left',
      required: false,
      type: 'text',
    };
    setPlaceholders([...placeholders, newPlaceholder]);
    toast.success(`Added placeholder: ${recommendedFontSize}pt ${recommendedFont}, ${recommendedHeight}px height`);
  };

  const updatePlaceholder = (id: string, updates: Partial<Placeholder>) => {
    setPlaceholders(
      placeholders.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const getCharacterCapacity = (placeholder: Placeholder) => {
    return calculateCharacterCapacity(
      placeholder.width,
      placeholder.height,
      placeholder.fontSize || 11,
      placeholder.fontFamily || 'Helvetica'
    );
  };

  const calculateGuideLines = (currentPlaceholderId?: string) => {
    if (!showAlignmentGuides) {
      setGuideLines({ x: [], y: [] });
      return;
    }

    const xLines = new Set<number>();
    const yLines = new Set<number>();

    // Get positions from all placeholders except the one being dragged
    placeholders.forEach((p) => {
      if (p.id === currentPlaceholderId) return;

      // For horizontal alignment - left and right edges only
      xLines.add(p.x); // Left edge
      xLines.add(p.x + p.width); // Right edge
    });

    const newGuideLines = {
      x: Array.from(xLines),
      y: Array.from(yLines),
    };
    
    console.log('Guide lines calculated:', newGuideLines);
    setGuideLines(newGuideLines);
  };

  const snapToGuide = (value: number, guides: number[], threshold: number = 5): number => {
    for (const guide of guides) {
      if (Math.abs(value - guide) < threshold) {
        return guide;
      }
    }
    return value;
  };

  const deletePlaceholder = (id: string) => {
    setPlaceholders(placeholders.filter((p) => p.id !== id));
    if (selectedPlaceholder === id) {
      setSelectedPlaceholder(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, placeholderId: string) => {
    e.stopPropagation();
    const placeholder = placeholders.find(p => p.id === placeholderId);
    if (!placeholder || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    console.log('Mouse down - Starting drag', {
      placeholderId,
      placeholdersCount: placeholders.length,
      showAlignmentGuides,
    });
    
    setIsDragging(true);
    setSelectedPlaceholder(placeholderId);
    setDragOffset({
      x: e.clientX - canvasRect.left - placeholder.x,
      y: e.clientY - canvasRect.top - placeholder.y,
    });

    // Calculate guide lines for alignment
    calculateGuideLines(placeholderId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedPlaceholder || !canvasRef.current) return;

    const placeholder = placeholders.find(p => p.id === selectedPlaceholder);
    if (!placeholder) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - dragOffset.x;
    let newY = e.clientY - canvasRect.top - dragOffset.y;

    // Snap to guides if enabled
    if (showAlignmentGuides) {
      // Horizontal alignment - snap left and right edges to other placeholders
      const leftSnap = snapToGuide(newX, guideLines.x);
      const rightEdge = newX + placeholder.width;
      const rightSnap = snapToGuide(rightEdge, guideLines.x);

      // Use the closest snap for horizontal
      if (Math.abs(leftSnap - newX) < Math.abs(rightSnap - rightEdge)) {
        newX = leftSnap;
      } else if (Math.abs(rightSnap - rightEdge) < 5) {
        newX = rightSnap - placeholder.width;
      }
    }

    updatePlaceholder(selectedPlaceholder, {
      x: Math.max(0, newX),
      y: Math.max(0, newY),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setGuideLines({ x: [], y: [] });
  };

  const handleResize = (placeholderId: string, deltaWidth: number, deltaHeight: number) => {
    const placeholder = placeholders.find(p => p.id === placeholderId);
    if (!placeholder) return;

    updatePlaceholder(placeholderId, {
      width: Math.max(50, placeholder.width + deltaWidth),
      height: Math.max(20, placeholder.height + deltaHeight),
    });
  };

  const savePlaceholders = async () => {
    if (!document) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'documents', document.id);
      await updateDoc(docRef, {
        placeholders,
        isTemplate: true,
        updatedAt: new Date(),
      });

      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving placeholders:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const updateTitle = async () => {
    if (!document || !editedTitle.trim()) return;

    try {
      const docRef = doc(db, 'documents', document.id);
      await updateDoc(docRef, {
        title: editedTitle.trim(),
        updatedAt: new Date(),
      });

      setDocument({ ...document, title: editedTitle.trim() });
      setIsEditingTitle(false);
      toast.success('Template name updated!');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update template name');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!document) return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Documents
            </Link>
            <div className="flex justify-between items-start">
              <div>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-3xl font-bold text-gray-900 border-2 border-indigo-500 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateTitle();
                        } else if (e.key === 'Escape') {
                          setIsEditingTitle(false);
                          setEditedTitle(document.title);
                        }
                      }}
                    />
                    <button
                      onClick={updateTitle}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingTitle(false);
                        setEditedTitle(document.title);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h1 
                    className="text-3xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-indigo-600 transition-colors inline-flex items-center gap-2"
                    onClick={() => setIsEditingTitle(true)}
                    title="Click to edit template name"
                  >
                    Edit Template: {document.title}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </h1>
                )}
                <p className="text-gray-600">
                  Add placeholders to create a fillable template
                </p>
                {/* Font Analysis Status */}
                {isAnalyzing && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span>Analyzing document fonts...</span>
                  </div>
                )}
                {fontAnalysis && !isAnalyzing && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                    <span className="text-lg">✨</span>
                    <span>
                      Smart recommendations active • Detected {fontAnalysis.detectedFonts.length} font styles
                    </span>
                  </div>
                )}
                {showAlignmentGuides && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span>
                      Alignment guides active • <span className="text-blue-600 font-medium">Blue = vertical edges</span>, <span className="text-red-600 font-medium">Red = top/bottom of dragged placeholder</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={addPlaceholder}
                  className="flex items-center gap-2 bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Add Placeholder
                </button>
                
                <button
                  onClick={() => setShowAlignmentGuides(!showAlignmentGuides)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
                    showAlignmentGuides
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Toggle alignment guides"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  Guides {showAlignmentGuides ? 'ON' : 'OFF'}
                </button>

                <button
                  onClick={savePlaceholders}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
                {document?.isTemplate && (
                  <button
                    onClick={() => setShowRecipientsModal(true)}
                    className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-medium"
                  >
                    <UserPlus className="h-5 w-5" />
                    Add Recipients
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Preview with Placeholders */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Document Preview
                  </h2>
                  {showAlignmentGuides && placeholders.length < 2 && (
                    <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                      💡 Add 2+ placeholders to see alignment guides
                    </div>
                  )}
                </div>
                <div
                  ref={canvasRef}
                  className="relative border rounded-lg overflow-hidden bg-gray-50 select-none"
                  style={{ minHeight: '800px' }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <iframe
                    ref={iframeRef}
                    src={`${document.fileUrl}#toolbar=0`}
                    className="w-full h-[800px] pointer-events-none"
                    title={document.title}
                  />
                  
                  {/* Alignment Guide Lines */}
                  {showAlignmentGuides && isDragging && selectedPlaceholder && (
                    <div className="absolute inset-0 pointer-events-none z-50">
                      {/* Vertical guide lines (left/right edges of OTHER placeholders) */}
                      {guideLines.x.map((x, index) => (
                        <div
                          key={`v-${index}`}
                          className="absolute top-0 bottom-0 bg-blue-500"
                          style={{ 
                            left: `${x}px`,
                            width: '1px',
                            opacity: 0.5,
                            boxShadow: '0 0 3px rgba(59, 130, 246, 0.3)'
                          }}
                        />
                      ))}
                      {/* Horizontal guide lines - TOP and BOTTOM of CURRENT placeholder */}
                      {(() => {
                        const currentPlaceholder = placeholders.find(p => p.id === selectedPlaceholder);
                        if (!currentPlaceholder) return null;
                        return (
                          <>
                            {/* Top edge line */}
                            <div
                              className="absolute left-0 right-0"
                              style={{ 
                                top: `${currentPlaceholder.y}px`,
                                height: '2px',
                                background: 'rgb(239, 68, 68)',
                                opacity: 0.8,
                                boxShadow: '0 0 4px rgba(239, 68, 68, 0.6)'
                              }}
                            />
                            {/* Bottom edge line */}
                            <div
                              className="absolute left-0 right-0"
                              style={{ 
                                top: `${currentPlaceholder.y + currentPlaceholder.height}px`,
                                height: '2px',
                                background: 'rgb(239, 68, 68)',
                                opacity: 0.8,
                                boxShadow: '0 0 4px rgba(239, 68, 68, 0.6)'
                              }}
                            />
                          </>
                        );
                      })()}
                      {/* Debug info */}
                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-px bg-blue-500"></div>
                          <span>Vertical edges</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-px bg-red-500 h-0.5"></div>
                          <span>Top/Bottom lines</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Placeholder overlays */}
                  <div className="absolute inset-0 pointer-events-none">
                    {placeholders.map((placeholder) => (
                      <div
                        key={placeholder.id}
                        className={`absolute border-2 pointer-events-auto ${
                          selectedPlaceholder === placeholder.id
                            ? 'border-primary-600 bg-primary-200'
                            : 'border-blue-400 bg-blue-100'
                        } bg-opacity-40 hover:bg-opacity-60 transition-all cursor-move group`}
                        style={{
                          left: `${placeholder.x}px`,
                          top: `${placeholder.y}px`,
                          width: `${placeholder.width}px`,
                          height: `${placeholder.height}px`,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, placeholder.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlaceholder(placeholder.id);
                        }}
                      >
                        <div className="flex items-center justify-between p-1 bg-white bg-opacity-90">
                          <GripVertical className="h-3 w-3 text-gray-500" />
                          <div className="text-xs font-medium text-primary-800 truncate flex-1 mx-1">
                            {placeholder.label}
                          </div>
                          <div className="text-[10px] text-gray-500 flex flex-col items-end">
                            <div>{placeholder.width}x{placeholder.height}</div>
                            <div className="text-primary-600 font-semibold">
                              ~{getCharacterCapacity(placeholder).capacity} chars
                            </div>
                          </div>
                        </div>
                        {/* Resize handles */}
                        {selectedPlaceholder === placeholder.id && (
                          <>
                            {/* Bottom-right resize handle - positioned outside */}
                            <div
                              className="absolute bg-primary-600 cursor-se-resize border border-white shadow-md rounded-sm hover:bg-primary-700 hover:scale-110 transition-transform"
                              style={{ 
                                bottom: '-4px',
                                right: '-4px',
                                width: '12px',
                                height: '12px',
                                zIndex: 10 
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startWidth = placeholder.width;
                                const startHeight = placeholder.height;

                                const handleResizeMove = (moveE: MouseEvent) => {
                                  moveE.preventDefault();
                                  const deltaX = moveE.clientX - startX;
                                  const deltaY = moveE.clientY - startY;
                                  updatePlaceholder(placeholder.id, {
                                    width: Math.max(50, startWidth + deltaX),
                                    height: Math.max(20, startHeight + deltaY),
                                  });
                                };

                                const handleResizeUp = () => {
                                  window.document.removeEventListener('mousemove', handleResizeMove);
                                  window.document.removeEventListener('mouseup', handleResizeUp);
                                };

                                window.document.addEventListener('mousemove', handleResizeMove);
                                window.document.addEventListener('mouseup', handleResizeUp);
                              }}
                            >
                              {/* Resize icon - diagonal lines */}
                              <svg className="w-full h-full p-0.5 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M10 2L2 10M10 6L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder Editor */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Placeholders ({placeholders.length})
                </h2>

                {placeholders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No placeholders yet.</p>
                    <p className="text-sm mt-2">Click "Add Placeholder" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {placeholders.map((placeholder) => (
                      <div
                        key={placeholder.id}
                        className={`border rounded-lg p-4 ${
                          selectedPlaceholder === placeholder.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <input
                            type="text"
                            value={placeholder.label}
                            onChange={(e) =>
                              updatePlaceholder(placeholder.id, {
                                label: e.target.value,
                              })
                            }
                            className="font-medium text-gray-900 border-0 p-0 focus:ring-0 w-full"
                            placeholder="Field Label"
                          />
                          <button
                            onClick={() => deletePlaceholder(placeholder.id)}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <label className="text-gray-600">Key:</label>
                            <input
                              type="text"
                              value={placeholder.key}
                              onChange={(e) =>
                                updatePlaceholder(placeholder.id, {
                                  key: e.target.value,
                                })
                              }
                              className="w-full mt-1 px-2 py-1 border rounded text-xs"
                              placeholder="field_name"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-gray-600">Type:</label>
                              <select
                                value={placeholder.type}
                                onChange={(e) =>
                                  updatePlaceholder(placeholder.id, {
                                    type: e.target.value as any,
                                  })
                                }
                                className="w-full mt-1 px-2 py-1 border rounded text-xs"
                              >
                                <option value="text">Text</option>
                                <option value="signature">Signature</option>
                                <option value="number">Number</option>
                                <option value="email">Email</option>
                                <option value="date">Date</option>
                                <option value="checkbox">Checkbox</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-gray-600 flex items-center justify-between">
                                <span>Font Size:</span>
                                {fontAnalysis && (
                                  <span className="text-[10px] text-primary-600 font-normal">
                                    ✨ {fontAnalysis.recommendedSize}pt
                                  </span>
                                )}
                              </label>
                              <input
                                type="number"
                                value={placeholder.fontSize}
                                onChange={(e) => {
                                  const newFontSize = parseInt(e.target.value);
                                  updatePlaceholder(placeholder.id, {
                                    fontSize: newFontSize,
                                  });
                                }}
                                className="w-full mt-1 px-2 py-1 border rounded text-xs"
                                min="6"
                                max="72"
                                placeholder={fontAnalysis?.recommendedSize.toString()}
                              />
                            </div>
                          </div>

                          {/* Recommended Height */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Recommended Height:</span>
                              <span className="text-xs font-semibold text-blue-700">
                                {recommendPlaceholderHeight(placeholder.fontSize || 11, 1)}px
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const recHeight = recommendPlaceholderHeight(placeholder.fontSize || 11, 1);
                                updatePlaceholder(placeholder.id, {
                                  height: recHeight,
                                });
                                toast.success(`Height adjusted to ${recHeight}px`);
                              }}
                              className="w-full text-xs bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                            >
                              Apply Recommended Height
                            </button>
                          </div>

                          {/* Font Family Selection */}
                          <div>
                            <label className="text-gray-600 flex items-center justify-between">
                              <span>Font Family:</span>
                              {fontAnalysis && (
                                <span className="text-[10px] text-primary-600 font-normal">
                                  ✨ {fontAnalysis.recommendedFont}
                                </span>
                              )}
                            </label>
                            <select
                              value={placeholder.fontFamily || 'Helvetica'}
                              onChange={(e) =>
                                updatePlaceholder(placeholder.id, {
                                  fontFamily: e.target.value,
                                })
                              }
                              className="w-full mt-1 px-2 py-1 border rounded text-xs"
                            >
                              <option value="Helvetica">Helvetica</option>
                              <option value="Helvetica-Bold">Helvetica Bold</option>
                              <option value="Times-Roman">Times Roman</option>
                              <option value="Times-Bold">Times Bold</option>
                              <option value="Courier">Courier</option>
                              <option value="Courier-Bold">Courier Bold</option>
                            </select>
                          </div>

                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={placeholder.required}
                                onChange={(e) =>
                                  updatePlaceholder(placeholder.id, {
                                    required: e.target.checked,
                                  })
                                }
                                className="rounded"
                              />
                              <span className="text-gray-600">Required</span>
                            </label>
                          </div>

                          {/* Character Capacity Info */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Character Capacity:</div>
                            {(() => {
                              const capacity = getCharacterCapacity(placeholder);
                              return (
                                <div className="bg-primary-50 rounded p-2 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Total:</span>
                                    <span className="font-semibold text-primary-700">
                                      ~{capacity.capacity} characters
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Per Line:</span>
                                    <span className="text-gray-700">
                                      ~{capacity.charsPerLine} chars
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-600">Lines:</span>
                                    <span className="text-gray-700">
                                      ~{capacity.lines} lines
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-500 mt-1">
                                    💡 Resize placeholder to adjust capacity
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Recipients Modal */}
        {document && (
          <AddRecipientsModal
            templateId={document.id}
            templateName={document.title}
            isOpen={showRecipientsModal}
            onClose={() => setShowRecipientsModal(false)}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
