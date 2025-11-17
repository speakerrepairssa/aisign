# 🔥 Firebase Setup Guide for AiSign

## Quick Setup Checklist

### Step 1: Authentication ✅
1. Go to Firebase Console → **Authentication**
2. Click **Get Started**
3. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click Save
4. Enable **Google**:
   - Click on "Google"
   - Toggle "Enable"
   - Enter project support email
   - Click Save

### Step 2: Cloud Firestore ✅
1. Go to Firebase Console → **Firestore Database**
2. Click **Create Database**
3. Select **Start in test mode** (for now)
4. Choose your region (e.g., us-central1, asia-south1, europe-west1)
5. Click **Enable**

### Step 3: Cloud Storage ✅
1. Go to Firebase Console → **Storage**
2. Click **Get Started**
3. Select **Start in test mode** (for now)
4. Choose the **same region** as Firestore
5. Click **Done**

### Step 4: Get Firebase Config ✅
1. Click ⚙️ icon → **Project Settings**
2. Scroll to **Your apps** section
3. Click **</>** (Web icon)
4. Register app with nickname: "AiSign"
5. Copy the firebaseConfig object

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 5: Configure Environment Variables ✅

**Option A: Use the setup script (Easy)**
```bash
chmod +x setup-firebase.sh
./setup-firebase.sh
```

**Option B: Manual setup**
1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Step 6: Set Up Security Rules 🔒

#### Firestore Rules:
1. Go to **Firestore Database** → **Rules** tab
2. Replace the content with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Documents collection
    match /documents/{documentId} {
      allow read: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         request.auth.email in resource.data.signers);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Signatures collection
    match /signatures/{signatureId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

#### Storage Rules:
1. Go to **Storage** → **Rules** tab
2. Replace the content with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId && 
        request.resource.contentType == 'application/pdf' &&
        request.resource.size < 10 * 1024 * 1024;
    }
    
    match /signatures/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId && 
        request.resource.contentType.matches('image/.*') &&
        request.resource.size < 1 * 1024 * 1024;
    }
  }
}
```

3. Click **Publish**

### Step 7: Test Your Setup ✅

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Try to:
   - ✅ Sign up with email/password
   - ✅ Sign in with Google
   - ✅ Upload a PDF document
   - ✅ View documents in dashboard

## 🎉 You're All Set!

Your AiSign application is now configured and ready to use!

## 🐛 Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure you've created the `.env.local` file
- Verify all environment variables are set correctly
- Restart the dev server after changing `.env.local`

### "Missing or insufficient permissions"
- Check that Firestore and Storage security rules are published
- Make sure you're signed in when testing

### "Upload failed"
- Verify Storage is enabled in Firebase Console
- Check Storage security rules allow uploads
- Ensure file is a PDF and under 10MB

### Authentication not working
- Verify Authentication is enabled in Firebase Console
- For Google OAuth, make sure you've set the support email
- Check that auth domain matches in `.env.local`

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🔄 What's Next?

After setup, you can:
1. Customize the UI colors in `tailwind.config.ts`
2. Add email notifications for document signing
3. Implement document templates
4. Add team collaboration features
5. Deploy to Vercel or your preferred hosting

Need help? Check the README.md or open an issue!
