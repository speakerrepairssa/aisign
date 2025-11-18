#!/bin/bash

# Vercel Deployment Script
# This script helps you deploy your app to Vercel step by step

echo "🚀 AI Sign - Vercel Deployment Helper"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📁 Step 1: Initializing Git repository..."
    git init
    echo "✅ Git initialized!"
else
    echo "✅ Git repository already initialized"
fi

echo ""
echo "📝 Step 2: Checking for uncommitted changes..."
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo "✅ No changes to commit"
else
    echo "💾 Committing changes..."
    read -p "Enter commit message (or press Enter for default): " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="Update: Ready for deployment"
    fi
    git commit -m "$commit_msg"
    echo "✅ Changes committed!"
fi

echo ""
echo "🔍 Step 3: Checking GitHub remote..."
if git remote | grep -q origin; then
    echo "✅ GitHub remote already configured"
    remote_url=$(git remote get-url origin)
    echo "   Remote URL: $remote_url"
else
    echo "⚠️  No GitHub remote found!"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository called 'aisign'"
    echo "3. Don't initialize with README"
    echo "4. Copy the repository URL"
    echo ""
    read -p "Enter your GitHub repository URL (e.g., https://github.com/username/aisign.git): " repo_url
    
    if [ ! -z "$repo_url" ]; then
        git remote add origin "$repo_url"
        git branch -M main
        echo "✅ GitHub remote added!"
    else
        echo "❌ No URL provided. Skipping..."
    fi
fi

echo ""
echo "☁️  Step 4: Pushing to GitHub..."
read -p "Push to GitHub now? (y/n): " push_confirm
if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
    git push -u origin main
    echo "✅ Code pushed to GitHub!"
else
    echo "⏭️  Skipped pushing to GitHub"
fi

echo ""
echo "======================================"
echo "✨ Next Steps:"
echo "======================================"
echo ""
echo "1. Go to https://vercel.com and sign in with GitHub"
echo "2. Click 'Add New Project'"
echo "3. Import your 'aisign' repository"
echo "4. Add these environment variables:"
echo ""
echo "   NEXT_PUBLIC_FIREBASE_API_KEY"
echo "   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "   NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "   NEXT_PUBLIC_FIREBASE_APP_ID"
echo ""
echo "   (Copy values from your .env.local file)"
echo ""
echo "5. Click 'Deploy'!"
echo ""
echo "📖 For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Good luck with your deployment!"
