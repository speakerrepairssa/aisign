#!/bin/bash

# AiSign Firebase Setup Script
echo "🔥 AiSign Firebase Setup"
echo "========================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

echo "Please enter your Firebase configuration values:"
echo "(You can find these in Firebase Console > Project Settings > Your apps)"
echo ""

read -p "API Key: " api_key
read -p "Auth Domain: " auth_domain
read -p "Project ID: " project_id
read -p "Storage Bucket: " storage_bucket
read -p "Messaging Sender ID: " messaging_sender_id
read -p "App ID: " app_id

# Create .env.local file
cat > .env.local << EOF
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=$api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=$app_id

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo ""
echo "✅ .env.local file created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up Firestore Security Rules (see FIREBASE_RULES.md)"
echo "2. Set up Storage Security Rules (see FIREBASE_RULES.md)"
echo "3. Run 'npm run dev' to start the development server"
echo ""
