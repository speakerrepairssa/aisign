# Deployment Guide for AiSign

## Option 1: Vercel (Recommended for Next.js) ⭐

Vercel is the easiest and best option for Next.js applications with full support for API routes, server functions, and automatic deployments.

### Steps:

1. **Sign up for Vercel** (if you haven't already)
   - Go to https://vercel.com
   - Sign up with your GitHub, GitLab, or Bitbucket account

2. **Push your code to GitHub**
   ```bash
   # Create a new repository on GitHub first, then:
   git remote add origin https://github.com/YOUR_USERNAME/aisign.git
   git branch -M main
   git push -u origin main
   ```

3. **Import project to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `aisign` repository
   - Vercel will auto-detect Next.js settings

4. **Add Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from your `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll get a URL like: `https://aisign.vercel.app`

6. **Update Firebase Settings**
   - Add your Vercel URL to Firebase Auth → Authorized domains
   - Update CORS settings for Firebase Storage

### Benefits:
- ✅ Zero configuration needed
- ✅ Automatic HTTPS
- ✅ API routes work perfectly
- ✅ Automatic deployments on git push
- ✅ Free tier is generous
- ✅ Built-in analytics and monitoring

---

## Option 2: Firebase Hosting + Cloud Run

If you prefer to keep everything in Firebase:

### Prerequisites:
```bash
npm install -g firebase-tools
firebase login
```

### Steps:

1. **Initialize Firebase**
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Use existing project
   - Public directory: `.next`
   - Configure as single-page app: No
   - Set up automatic builds: No

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Create standalone build** (add to package.json):
   ```json
   "scripts": {
     "build": "next build",
     "export": "next build && next export"
   }
   ```

4. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

### Limitations:
- ⚠️ API routes won't work with standard Firebase Hosting
- ⚠️ Requires Cloud Functions or Cloud Run for server-side features
- ⚠️ More complex setup

---

## Option 3: Quick Deploy with Vercel CLI

If you want to deploy immediately without GitHub:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose "AiSign" as project name
   - Deploy to production: Yes

4. **Add environment variables**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   # ... add all environment variables
   ```

5. **Redeploy with env vars**
   ```bash
   vercel --prod
   ```

---

## Recommended Approach

**Use Vercel** - It's specifically designed for Next.js and handles:
- API routes automatically
- Server-side rendering
- Image optimization
- Automatic SSL
- Global CDN
- Zero configuration

Once deployed to Vercel, you can:
1. Test the SMTP email functionality in production
2. Use a custom domain if needed
3. Set up automatic deployments from git

## Post-Deployment Checklist

After deployment, update:
- [ ] Firebase Auth → Authorized domains (add your production URL)
- [ ] Firebase Storage → CORS settings
- [ ] Firestore Security Rules (already documented in FIRESTORE_RULES.md)
- [ ] Test email functionality with production SMTP settings
- [ ] Test API key generation
- [ ] Test webhook integrations

## Environment Variables Needed

Make sure these are set in your deployment platform:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Firebase Hosting: https://firebase.google.com/docs/hosting
