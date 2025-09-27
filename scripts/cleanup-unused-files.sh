#!/bin/bash

echo "🧹 Cleaning Up Unused Files"
echo "=========================="

echo "📋 Files to be removed:"

# List files that will be removed
echo "   📄 Old deployment scripts:"
ls -la *deploy*.sh 2>/dev/null | grep -v "deploy-vps-one-click.sh" | grep -v "setup-local-database.sh" | grep -v "run-local-with-old-design.sh" || echo "   (none found)"

echo "   📄 Old fix scripts:"
ls -la fix-*.sh 2>/dev/null || echo "   (none found)"

echo "   📄 Old restore scripts:"
ls -la restore-*.sh 2>/dev/null || echo "   (none found)"

echo "   📄 Old access scripts:"
ls -la access-*.sh 2>/dev/null || echo "   (none found)"

echo "   📄 Old emergency scripts:"
ls -la emergency-*.sh 2>/dev/null || echo "   (none found)"

echo "   📄 Old clean scripts:"
ls -la clean-*.sh 2>/dev/null | grep -v "cleanup-unused-files.sh" || echo "   (none found)"

echo "   📄 Old apply scripts:"
ls -la apply-*.sh 2>/dev/null || echo "   (none found)"

echo "   📄 Old force scripts:"
ls -la force-*.sh 2>/dev/null || echo "   (none found)"

echo "   📄 Old setup scripts:"
ls -la setup-*.sh 2>/dev/null | grep -v "setup-local-database.sh" || echo "   (none found)"

echo ""
read -p "❓ Do you want to proceed with cleanup? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removing unused files..."
    
    # Remove old deployment scripts (keep only the new ones)
    rm -f deploy-real-app.sh
    rm -f deploy-frontend-only.sh
    rm -f deploy-frontend-direct.sh
    rm -f deploy-nextjs-with-old-design.sh
    rm -f deploy-old-frontend.sh
    rm -f deploy-nextjs-simple.sh
    
    # Remove fix scripts
    rm -f fix-*.sh
    
    # Remove restore scripts
    rm -f restore-*.sh
    
    # Remove access scripts
    rm -f access-*.sh
    
    # Remove emergency scripts
    rm -f emergency-*.sh
    
    # Remove clean scripts (except this one)
    rm -f clean-vercel-projects.sh
    
    # Remove apply scripts
    rm -f apply-*.sh
    
    # Remove force scripts
    rm -f force-*.sh
    
    # Remove old setup scripts (keep the new database one)
    rm -f setup-domain-dns.sh
    
    # Remove old SQL files (we have better ones now)
    rm -f create-demo-data.sql
    
    echo "✅ Cleanup completed!"
    
    echo ""
    echo "📁 Remaining essential files:"
    echo "   ✅ setup-local-database.sh - Setup local PostgreSQL"
    echo "   ✅ run-local-with-old-design.sh - Run local development"
    echo "   ✅ deploy-vps-one-click.sh - Deploy to VPS"
    echo "   ✅ cleanup-unused-files.sh - This cleanup script"
    
else
    echo "❌ Cleanup cancelled"
fi

echo ""
echo "📊 Current directory size:"
du -sh . 2>/dev/null || echo "Unable to calculate size"

echo ""
echo "📋 Quick commands:"
echo "   🗄️ Setup database: ./setup-local-database.sh"
echo "   🏃‍♂️ Run local: ./run-local-with-old-design.sh"
echo "   🚀 Deploy VPS: ./deploy-vps-one-click.sh"