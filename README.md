# AiSign - Document Signing & Template Management Platform

A comprehensive document signing and template management application built with Next.js 14, Firebase, and TypeScript. Features comparable to DocuSeal with advanced automation capabilities for n8n, Make.com, Pabbly, and WordPress.

## 📖 **COMPREHENSIVE DOCUMENTATION AVAILABLE IN-APP**

### 👉 Access Live Documentation: [http://localhost:3000/docs](http://localhost:3000/docs)

The app includes **complete, always-updated documentation** covering:
- ✅ All features with implementation details
- ✅ Architecture and file structure
- ✅ Step-by-step workflows
- ✅ Complete API reference
- ✅ What each file/component handles
- ✅ How to add new features

**For developers wanting to update/extend the app, start with `/docs` in the running application!**

## 🚀 Features

### Core Features
- **User Authentication** - Secure sign-up/sign-in with email/password and Google OAuth
- **Document Upload** - Drag-and-drop PDF upload with progress tracking
- **Document Management** - View, organize, and track all your documents
- **Digital Signatures** - Create and apply legally binding electronic signatures
- **Real-time Updates** - Live document status tracking with Firestore
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Secure Storage** - Documents stored securely in Firebase Cloud Storage

### Advanced Features (DocuSeal Parity)
- **Smart Template Creation** - Drag & drop placeholders with auto font detection ✨
- **Character Capacity** - Real-time calculation based on font and dimensions
- **Submission Tracking** - Track status: Pending → Sent → Opened → Completed
- **Multi-Recipient Support** - Send to multiple recipients with unique links
- **Template Cloning** - Duplicate templates with all placeholders and settings
- **Archive Management** - Soft delete with restore capability
- **Copy Links** - One-click shareable links for templates and submissions
- **API Integration** - REST API for automation tools (n8n, Make.com, etc.)
- **Smart Font Detection** - Auto-detect PDF fonts and recommend optimal sizes

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

**⚠️ For detailed architecture, see the in-app documentation at `/docs`**

```
aisign/
├── app/                          # Next.js app directory
│   ├── api/                     # API routes
│   │   ├── keys/generate        # API key generation
│   │   ├── submissions          # Submission management
│   │   └── templates/[id]/fill  # Template filling
│   ├── dashboard/               # Main dashboard
│   ├── docs/                    # 📖 IN-APP DOCUMENTATION (START HERE!)
│   ├── documents/               # Document viewing/editing
│   │   └── [id]/edit           # Template editor with placeholders
│   ├── submissions/             # Submissions tracking dashboard
│   ├── login/                   # Login page
│   ├── signup/                  # Sign up page
│   └── globals.css             # Global styles
├── components/                   # React components
│   ├── auth/                    # Authentication components
│   ├── documents/               # Document management (clone, archive, etc.)
│   ├── layout/                  # Layout with navigation
│   ├── submissions/             # Recipient modal and UI
│   └── signature/               # Signature components
├── hooks/                        # Custom React hooks
│   └── useSubmissions.ts        # Submission management hook
├── lib/                          # Utility libraries
│   ├── firebase.ts              # Firebase client SDK
│   ├── fontDetection.ts         # Smart font detection & capacity calc
│   └── pdfFiller.ts             # PDF filling utilities
├── store/                        # State management (Zustand)
│   └── authStore.ts             # Auth state store
├── types/                        # TypeScript type definitions
│   ├── index.ts                 # Core types (Document, User, etc.)
│   ├── submission.ts            # Submission & Recipient types
│   └── template.ts              # Placeholder & Template types
└── public/                       # Static assets

📚 Documentation Files:
├── README.md                     # This file (overview)
├── DOCUSEAL_FEATURES.md         # Complete feature guide
├── FEATURES_SUMMARY.md          # Quick reference
├── CHARACTER_CAPACITY.md        # Character capacity details
├── API_DOCUMENTATION.md         # API integration guide
└── FONT_DETECTION.md            # Font detection guide
```

## 🎯 Usage

### Basic Usage
1. **Sign Up**: Create an account using email/password or Google
2. **Upload Document**: Click "Upload Document" and select a PDF file
3. **Create Template**: Click "Template" → Add placeholders with drag & drop
4. **Add Recipients**: Click "Add Recipients" → Enter email addresses
5. **Track Submissions**: Go to "Submissions" tab → Monitor real-time status
6. **Clone Templates**: Click copy icon to duplicate templates
7. **Archive Old Templates**: Click archive icon to organize

### For Developers/Contributors
1. **Read In-App Documentation**: Navigate to `/docs` (top navigation)
2. **Review Architecture**: Check directory structure and data flow
3. **Understand Features**: See complete feature list with file locations
4. **Follow Workflows**: Step-by-step guides for common tasks
5. **API Integration**: Complete API reference with examples

**📖 Always check `/docs` before making changes - it explains what handles what!**

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

## ✅ Completed Features

- [x] Multiple signature field placement
- [x] Document templates with placeholders
- [x] Smart font detection
- [x] Character capacity calculation
- [x] Submission tracking system
- [x] Multi-recipient support
- [x] Template cloning
- [x] Archive functionality
- [x] Copy shareable links
- [x] API for integrations (REST API)
- [x] Real-time status tracking
- [x] In-app comprehensive documentation

## 📝 Future Enhancements

- [ ] Email notifications for signers (SMTP integration)
- [ ] Bulk document upload
- [ ] Document expiration dates
- [ ] Enhanced audit trail
- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Webhook support for external notifications
- [ ] Advanced analytics dashboard
- [ ] Export/download batch operations
- [ ] E-signature legal compliance features

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
