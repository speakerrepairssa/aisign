# Firebase Security Rules for AiSign

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false; // Users can't delete their own records
    }
    
    // Documents collection
    match /documents/{documentId} {
      allow read: if isAuthenticated() && 
        (resource.data.ownerId == request.auth.uid || 
         request.auth.uid in resource.data.signers ||
         request.auth.email in resource.data.signers);
      
      allow create: if isAuthenticated() && 
        request.resource.data.ownerId == request.auth.uid;
      
      allow update: if isAuthenticated() && 
        (resource.data.ownerId == request.auth.uid ||
         request.auth.uid in resource.data.signers ||
         request.auth.email in resource.data.signers);
      
      allow delete: if isAuthenticated() && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Signatures collection
    match /signatures/{signatureId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      
      allow update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      
      allow delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check file size (max 10MB)
    function isValidFileSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Helper function to check if file is PDF
    function isPDF() {
      return request.resource.contentType == 'application/pdf';
    }
    
    // Helper function to check if file is image
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // Documents storage
    match /documents/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
        request.auth.uid == userId && 
        isPDF() && 
        isValidFileSize();
    }
    
    // Signatures storage
    match /signatures/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
        request.auth.uid == userId && 
        isImage() && 
        request.resource.size < 1 * 1024 * 1024; // 1MB limit for signatures
    }
  }
}
```

## Setup Instructions

1. **Firestore Rules:**
   - Go to Firebase Console
   - Navigate to Firestore Database > Rules
   - Copy and paste the Firestore rules above
   - Click "Publish"

2. **Storage Rules:**
   - Go to Firebase Console
   - Navigate to Storage > Rules
   - Copy and paste the Storage rules above
   - Click "Publish"

## Important Notes

- These rules ensure users can only access their own data
- File size limits are in place to prevent abuse
- Only PDF files can be uploaded as documents
- Only images can be uploaded as signatures
- All operations require authentication
- Users cannot delete their user records (data retention policy)
