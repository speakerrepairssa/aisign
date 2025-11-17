# Firebase Firestore Security Rules

To enable API key management, update your Firestore security rules in the Firebase Console:

## Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database → Rules
4. Add the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Documents - users can only access their own documents
    match /documents/{documentId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Submissions - users can access their own submissions
    match /submissions/{submissionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Settings - users can read/write their own settings
    match /settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // API Keys - users can manage their own API keys
    match /apiKeys/{keyId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Public submissions - allow anyone with the link to read
    match /publicSubmissions/{submissionId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Quick Fix (Alternative)

If you don't want to update Firestore rules right now, the API keys are stored in your user settings document which already has proper permissions.
