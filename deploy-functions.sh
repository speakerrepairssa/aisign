#!/bin/bash

echo "🔍 Checking if App Engine is enabled for aisign-cdee3..."
echo ""
echo "Please follow these steps in your browser:"
echo "1. Go to: https://console.cloud.google.com/appengine?project=aisign-cdee3"
echo "2. Click 'Create Application'"
echo "3. Select region: us-central (recommended)"
echo "4. Click 'Next' and then 'I'll do this later' for language"
echo ""
echo "Once App Engine is created, press Enter to deploy Cloud Functions..."
read -p "Press Enter when App Engine is ready: "

echo ""
echo "🚀 Deploying Cloud Functions to Firebase..."
firebase deploy --only functions

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📧 Test your email function at: https://aisign-cdee3.web.app/settings"
