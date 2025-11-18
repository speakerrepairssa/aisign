'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Document } from '@/types';
import { FileText, Eye, Trash2, Send, Link as LinkIcon, Archive, Copy, ArchiveRestore, User } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DocumentList() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'documents'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Document[];

      // Sort in memory instead of in query
      docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setDocuments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleClone = async (document: Document) => {
    if (!user) return;
    
    try {
      const clonedDoc = {
        ...document,
        title: `${document.title} (Copy)`,
        fileName: `${document.fileName} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: user.uid,
        ownerEmail: user.email || '',
        status: 'draft',
        completedAt: null,
      };
      
      // Remove the id field
      const { id, ...docWithoutId } = clonedDoc;
      
      await addDoc(collection(db, 'documents'), docWithoutId);
      toast.success('Template cloned successfully!');
    } catch (error) {
      console.error('Error cloning document:', error);
      toast.error('Failed to clone template');
    }
  };

  const handleArchive = async (documentId: string, currentlyArchived: boolean) => {
    try {
      await updateDoc(doc(db, 'documents', documentId), {
        isArchived: !currentlyArchived,
        updatedAt: new Date(),
      });
      toast.success(currentlyArchived ? 'Template restored!' : 'Template archived!');
    } catch (error) {
      console.error('Error archiving document:', error);
      toast.error('Failed to archive template');
    }
  };

  const handleCopyLink = (documentId: string) => {
    const link = `${window.location.origin}/documents/${documentId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'documents', documentId));
      toast.success('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const filteredDocuments = documents.filter(
    (doc) => showArchived ? doc.isArchived : !doc.isArchived
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
        <p className="text-gray-500">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Archive Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          {showArchived ? 'View Active' : 'View Archived'}
        </button>
      </div>

      {/* Card Grid View */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {showArchived ? 'No archived documents' : 'No documents yet. Upload a document to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Link
              key={document.id}
              href={document.isTemplate ? `/template?id=${document.id}` : `/view-document?id=${document.id}`}
              className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 hover:border-primary-400"
            >
              {/* Document Preview/Icon */}
              <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                <FileText className="h-20 w-20 text-gray-300" />
                {document.isTemplate && (
                  <span className="absolute top-3 right-3 text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-medium">
                    Template
                  </span>
                )}
              </div>
              
              {/* Document Info */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-2 truncate text-lg" title={document.title}>
                  {document.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <User className="h-4 w-4" />
                  <span className="truncate">{document.ownerEmail}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>{format(document.createdAt, 'dd MMM yyyy')}</span>
                    <span>•</span>
                    <span>{format(document.createdAt, 'HH:mm')}</span>
                  </div>
                  {document.submissionCount && document.submissionCount > 0 && (
                    <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                      {document.submissionCount} submission{document.submissionCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Remove the old table structure below */}
      <div className="hidden bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {document.title}
                          {document.isTemplate && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Template
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{document.fileName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={document.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(document.createdAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 flex-wrap">
                      {document.isTemplate ? (
                        <Link
                          href={`/template?id=${document.id}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                          title="View template & submissions"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      ) : (
                        <Link
                          href={`/view-document?id=${document.id}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      )}
                      
                      {document.status === 'draft' && !document.isTemplate && (
                        <Link
                          href={`/edit-document?id=${document.id}`}
                          className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                          title="Create template"
                        >
                          <Send className="h-4 w-4" />
                        </Link>
                      )}
                      
                      {document.isTemplate && (
                        <Link
                          href={`/edit-document?id=${document.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          title="Edit template"
                        >
                          <Send className="h-4 w-4" />
                        </Link>
                      )}
                      
                      <button
                        onClick={() => handleCopyLink(document.id)}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                        title="Copy link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleClone(document)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        title="Clone"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleArchive(document.id, document.isArchived || false)}
                        className="text-orange-600 hover:text-orange-900 flex items-center gap-1"
                        title={document.isArchived ? 'Restore' : 'Archive'}
                      >
                        {document.isArchived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(document.id)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {showArchived ? 'No archived documents' : 'No active documents'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  );
}
