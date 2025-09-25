#!/bin/bash

echo "🔄 Git Repository Migration Script"
echo "=================================="

# Current remotes
echo "📋 Current git remotes:"
git remote -v

echo ""
echo "🎯 Migration Plan:"
echo "   ❌ Remove: Aew-Work/internship.git"
echo "   ✅ Keep: aewaew419/internship.git (origin)"
echo "   ➕ Add: ultramanx88/internship.git (ultraman)"
echo "   🔄 Setup dual push to both repositories"

echo ""
read -p "Continue with migration? (y/N): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

# Step 1: Remove aew-work remote
echo ""
echo "🗑️ Step 1: Removing aew-work remote..."
git remote remove aew-work
echo "✅ aew-work remote removed"

# Step 2: Add ultraman remote
echo ""
echo "➕ Step 2: Adding ultraman remote..."
git remote add ultraman https://github.com/ultramanx88/internship.git
echo "✅ ultraman remote added"

# Step 3: Verify remotes
echo ""
echo "📋 Updated remotes:"
git remote -v

# Step 4: Push to ultraman repository (first time)
echo ""
echo "📤 Step 3: Initial push to ultraman repository..."
echo "⚠️  Note: This might fail if repository doesn't exist yet"
read -p "Push to ultraman repository now? (y/N): " PUSH_NOW

if [[ $PUSH_NOW =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to ultraman..."
    git push ultraman main || {
        echo "❌ Push failed. Repository might not exist yet."
        echo "💡 Please create the repository at: https://github.com/ultramanx88/internship.git"
        echo "   Then run: git push ultraman main"
    }
fi

# Step 5: Setup dual push
echo ""
echo "🔄 Step 4: Setting up dual push..."

# Add both URLs to origin for push
git remote set-url --add --push origin https://github.com/aewaew419/internship.git
git remote set-url --add --push origin https://github.com/ultramanx88/internship.git

echo "✅ Dual push configured"

# Step 6: Verify configuration
echo ""
echo "📋 Final configuration:"
git remote -v

echo ""
echo "🧪 Testing dual push setup..."
echo "Current branch: $(git branch --show-current)"

# Create a test commit to verify
echo ""
read -p "Create a test commit to verify dual push? (y/N): " TEST_COMMIT

if [[ $TEST_COMMIT =~ ^[Yy]$ ]]; then
    # Create test file
    echo "# Git Migration Test" > git-migration-test.md
    echo "Migration completed on $(date)" >> git-migration-test.md
    echo "Repositories:" >> git-migration-test.md
    echo "- aewaew419/internship.git" >> git-migration-test.md
    echo "- ultramanx88/internship.git" >> git-migration-test.md
    
    git add git-migration-test.md
    git commit -m "test: verify dual push setup after git migration"
    
    echo "🚀 Pushing to both repositories..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Dual push successful!"
        # Clean up test file
        git rm git-migration-test.md
        git commit -m "cleanup: remove git migration test file"
        git push origin main
    else
        echo "❌ Dual push failed"
        echo "💡 Check if ultramanx88/internship.git repository exists"
    fi
fi

echo ""
echo "🎉 Git Migration Complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Removed: Aew-Work/internship.git"
echo "   ✅ Kept: aewaew419/internship.git (origin)"
echo "   ✅ Added: ultramanx88/internship.git (ultraman)"
echo "   ✅ Configured dual push"
echo ""
echo "🔄 Usage:"
echo "   git push origin main    # Pushes to BOTH repositories"
echo "   git push ultraman main  # Pushes to ultraman only"
echo ""
echo "📝 Next Steps:"
echo "   1. Verify both repositories have the code"
echo "   2. Update deployment scripts to use new URLs"
echo "   3. Update documentation"
echo ""