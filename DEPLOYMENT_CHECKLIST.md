# ✅ Vercel Deployment Checklist

Use this checklist to make sure you've completed all steps:

## Before Deployment

- [ ] Code is working locally (`npm run dev`)
- [ ] Code builds successfully (`npm run build`)
- [ ] `.env.local` file has all Firebase credentials
- [ ] `.gitignore` includes `.env.local` and `.env`
- [ ] All changes are saved

## GitHub Setup

- [ ] Created GitHub account at https://github.com
- [ ] Created new repository called "aisign"
- [ ] Pushed code to GitHub (or run `./deploy-to-vercel.sh`)

## Vercel Setup

- [ ] Created Vercel account at https://vercel.com
- [ ] Connected Vercel to GitHub account
- [ ] Imported "aisign" repository
- [ ] Added all environment variables:
  - [ ] NEXT_PUBLIC_FIREBASE_API_KEY
  - [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - [ ] NEXT_PUBLIC_FIREBASE_APP_ID
- [ ] Clicked "Deploy" button
- [ ] Deployment succeeded (got a live URL)

## Firebase Configuration

- [ ] Opened Firebase Console
- [ ] Went to Authentication → Settings → Authorized domains
- [ ] Added Vercel domain (e.g., your-app.vercel.app)
- [ ] If using Storage: Updated CORS settings

## Post-Deployment

- [ ] Visited the Vercel URL
- [ ] Tested login functionality
- [ ] Tested main features
- [ ] Updated `NEXT_PUBLIC_APP_URL` in Vercel env vars to production URL
- [ ] Redeployed to apply URL change

## Future Deployments

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push
```

That's it! Vercel auto-deploys when you push to GitHub! 🎉

---

## 🆘 Having Issues?

### Build fails on Vercel
- Check the "Functions" or "Build Logs" tab in Vercel dashboard
- Make sure you can run `npm run build` locally without errors

### Can't log in after deployment
- Verify all Firebase environment variables are correct (no typos!)
- Check Firebase Console → Authorized domains includes your Vercel URL

### "Module not found" errors
- Make sure all dependencies are in package.json
- Try running `npm install` locally
- Push the updated package.json to GitHub

### Still stuck?
- Check VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions
- Check Vercel dashboard deployment logs
- Visit Vercel documentation: https://vercel.com/docs
