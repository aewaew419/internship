#!/bin/bash

echo "🧹 Clean Vercel Projects"
echo "======================="

echo "📋 List all your Vercel projects:"
vercel ls

echo ""
echo "🗑️ To remove unused projects:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click on project you want to delete"
echo "3. Go to Settings tab"
echo "4. Scroll down to 'Delete Project'"
echo "5. Type project name to confirm"
echo "6. Click 'Delete'"
echo ""

echo "🔄 To redeploy existing project:"
echo "1. Find your project in dashboard"
echo "2. Click 'View Function Logs' or 'Deployments'"
echo "3. Click 'Redeploy' on latest deployment"
echo "4. Select branch and click 'Deploy'"
echo ""

echo "📱 Quick commands:"
echo "vercel ls                    # List projects"
echo "vercel rm <project-name>     # Remove project"
echo "vercel --prod               # Deploy to production"
echo "vercel --prod --force       # Force deploy"
echo ""

echo "🎯 For this project specifically:"
echo "Project name: internship-frontend"
echo "Repository: ultramanx88/internship"
echo "Branch: main"