# AiSign - Document Signing Application

A modern document signing application built with Next.js 14, Firebase, and TypeScript. Create, send, and sign documents online with ease.

## 🚀 Features

- **User Authentication** - Secure sign-up/sign-in with email/password and Google OAuth
- **Document Upload** - Drag-and-drop PDF upload with progress tracking
- **Document Management** - View, organize, and track all your documents
- **Digital Signatures** - Create and apply legally binding electronic signatures
- **Real-time Updates** - Live document status tracking with Firestore
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Secure Storage** - Documents stored securely in Firebase Cloud Storage

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage)
- **State Management:** Zustand
- **UI Components:** Lucide Icons, React Hot Toast
- **PDF Handling:** react-pdf
- **Signature Drawing:** signature_pad

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- A Firebase account

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
cd /Users/mobalife/Desktop/aisign
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - **Authentication** (Email/Password and Google providers)
   - **Cloud Firestore**
   - **Cloud Storage**

4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click the web icon (</>)
   - Copy the configuration values

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Set Up Firestore Security Rules

In Firebase Console, go to Firestore Database > Rules and add:

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
         request.auth.uid in resource.data.signers);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
  }
}
```

### 6. Set Up Storage Security Rules

In Firebase Console, go to Storage > Rules and add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /signatures/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
aisign/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard page
│   ├── documents/           # Document viewing pages
│   ├── login/              # Login page
│   ├── signup/             # Sign up page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── documents/          # Document-related components
│   ├── layout/             # Layout components
│   ├── providers/          # Context providers
│   └── signature/          # Signature components
├── lib/                     # Utility libraries
│   └── firebase.ts         # Firebase configuration
├── store/                   # State management
│   └── authStore.ts        # Auth state store
├── types/                   # TypeScript type definitions
│   └── index.ts            # Global types
└── public/                  # Static assets
```

## 🎯 Usage

1. **Sign Up**: Create an account using email/password or Google
2. **Upload Document**: Click "Upload Document" and select a PDF file
3. **View Documents**: All uploaded documents appear in your dashboard
4. **View Details**: Click on any document to view its details and preview
5. **Sign Documents**: Add signature fields and sign documents
6. **Share**: Send documents to others for signing

## 🔒 Security Features

- Secure authentication with Firebase Auth
- Row-level security with Firestore rules
- Protected routes requiring authentication
- Secure file storage with access control
- HTTPS encryption for all data transfer

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Railway

## 📝 Future Enhancements

- [ ] Multiple signature field placement
- [ ] Email notifications for signers
- [ ] Document templates
- [ ] Bulk document upload
- [ ] Document expiration dates
- [ ] Audit trail for signatures
- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] API for integrations
- [ ] Advanced analytics dashboard

## 🐛 Troubleshooting

### Dependencies Installation Error
If you encounter npm errors, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase Connection Issues
- Verify all environment variables are correctly set
- Check Firebase project settings
- Ensure Firebase services are enabled

### Build Errors
```bash
npm run build
```
Check the error output and ensure all TypeScript types are correct.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for backend services
- Tailwind CSS for styling utilities
- All open-source contributors

## 📧 Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Next.js and Firebase
