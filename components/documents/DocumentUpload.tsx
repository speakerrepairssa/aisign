'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface UploadProgress {
  fileName: string;
  progress: number;
}

export default function DocumentUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const { user } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) return;

      setUploading(true);
      const progressArray: UploadProgress[] = acceptedFiles.map((file) => ({
        fileName: file.name,
        progress: 0,
      }));
      setUploadProgress(progressArray);

      try {
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i];
          const filePath = `documents/${user.uid}/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, filePath);
          const uploadTask = uploadBytesResumable(storageRef, file);

          await new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress((prev) =>
                  prev.map((item, index) =>
                    index === i ? { ...item, progress } : item
                  )
                );
              },
              (error) => {
                toast.error(`Failed to upload ${file.name}`);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Create document record in Firestore
                await addDoc(collection(db, 'documents'), {
                  title: file.name.replace(/\.[^/.]+$/, ''),
                  fileName: file.name,
                  fileUrl: downloadURL,
                  filePath,
                  ownerId: user.uid,
                  ownerEmail: user.email,
                  status: 'draft',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  signatureFields: [],
                  signers: [],
                });

                toast.success(`${file.name} uploaded successfully`);
                resolve(true);
              }
            );
          });
        }

        setUploadProgress([]);
        if (onUploadComplete) onUploadComplete();
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
    },
    [user, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    disabled: uploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-lg text-primary-600 font-medium">Drop your files here...</p>
        ) : (
          <>
            <p className="text-lg text-gray-700 font-medium mb-2">
              Drag & drop PDF files here, or click to select
            </p>
            <p className="text-sm text-gray-500">Support for PDF documents</p>
          </>
        )}
      </div>

      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-3">
          {uploadProgress.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">{item.fileName}</span>
                </div>
                <span className="text-sm text-gray-500">{Math.round(item.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
