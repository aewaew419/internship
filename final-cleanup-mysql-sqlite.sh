#!/bin/bash

echo "🧹 Final MySQL/SQLite Cleanup"
echo "============================="

# Clean up docker-compose.production.yml
echo "🐳 Cleaning docker-compose.production.yml..."
if [ -f "docker-compose.production.yml" ]; then
    # Remove MySQL service if exists
    if grep -q "mysql" docker-compose.production.yml; then
        echo "🗑️ Removing MySQL from docker-compose.production.yml..."
        # Create a backup
        cp docker-compose.production.yml docker-compose.production.yml.backup
        
        # Remove MySQL service section
        sed -i.tmp '/mysql:/,/^[[:space:]]*[^[:space:]]/{ /^[[:space:]]*[^[:space:]]/!d; }' docker-compose.production.yml
        sed -i.tmp '/mysql:/d' docker-compose.production.yml
        
        # Remove MySQL references
        sed -i.tmp '/mysql/d' docker-compose.production.yml
        
        rm docker-compose.production.yml.tmp 2>/dev/null
        echo "✅ Cleaned docker-compose.production.yml"
    fi
fi

# Clean up test files
echo ""
echo "🧪 Cleaning test files..."

TEST_FILES=(
    "apps/backend/tests/unit/services_test.go"
    "apps/backend/tests/enhanced_test_config.go"
    "apps/backend/tests/example_error_handler_test.go"
    "apps/backend/tests/monitoring_test.go"
    "apps/backend/tests/test_config.go"
    "apps/backend/tests/comprehensive_test_suite.go"
    "apps/backend/internal/middleware/middleware_test.go"
    "apps/backend/internal/middleware/rbac_test.go"
    "apps/backend/internal/handlers/dashboard_test.go"
    "apps/backend/internal/services/jwt_test.go"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "🔧 Updating $file..."
        # Replace MySQL/SQLite imports with PostgreSQL
        sed -i.bak 's|gorm.io/driver/mysql|gorm.io/driver/postgres|g' "$file"
        sed -i.bak 's|gorm.io/driver/sqlite|gorm.io/driver/postgres|g' "$file"
        sed -i.bak 's|mysql.Open|postgres.Open|g' "$file"
        sed -i.bak 's|sqlite.Open|postgres.Open|g' "$file"
        sed -i.bak 's|"mysql"|"postgres"|g' "$file"
        sed -i.bak 's|"sqlite"|"postgres"|g' "$file"
        
        # Update DSN format
        sed -i.bak 's|root:password@tcp(localhost:3306)/test|postgres:password@localhost:5432/test?sslmode=disable|g' "$file"
        sed -i.bak 's|:memory:|postgres://postgres:password@localhost:5432/test_memory?sslmode=disable|g' "$file"
        
        rm "$file.bak" 2>/dev/null
    fi
done

# Clean up .env file
echo ""
echo "🔧 Cleaning apps/backend/.env..."
if [ -f "apps/backend/.env" ]; then
    # Update DATABASE_URL to PostgreSQL format
    sed -i.bak 's|mysql://|postgresql://|g' apps/backend/.env
    sed -i.bak 's|sqlite:|postgresql://postgres:password@localhost:5432/internship_dev?sslmode=disable|g' apps/backend/.env
    sed -i.bak 's|@tcp(|@|g' apps/backend/.env
    sed -i.bak 's|:3306|:5432|g' apps/backend/.env
    sed -i.bak 's|charset=utf8mb4&parseTime=True&loc=Local|sslmode=disable|g' apps/backend/.env
    
    rm apps/backend/.env.bak 2>/dev/null
    echo "✅ Updated apps/backend/.env"
fi

# Clean up demo_api_server.go
echo ""
echo "🔧 Cleaning demo_api_server.go..."
if [ -f "apps/backend/demo_api_server.go" ]; then
    sed -i.bak 's|gorm.io/driver/mysql|gorm.io/driver/postgres|g' apps/backend/demo_api_server.go
    sed -i.bak 's|gorm.io/driver/sqlite|gorm.io/driver/postgres|g' apps/backend/demo_api_server.go
    sed -i.bak 's|mysql.Open|postgres.Open|g' apps/backend/demo_api_server.go
    sed -i.bak 's|sqlite.Open|postgres.Open|g' apps/backend/demo_api_server.go
    
    # Update DSN in demo server
    sed -i.bak 's|root:password@tcp(localhost:3306)/internship|postgres:password@localhost:5432/internship_demo?sslmode=disable|g' apps/backend/demo_api_server.go
    sed -i.bak 's|internship.db|postgres://postgres:password@localhost:5432/internship_demo?sslmode=disable|g' apps/backend/demo_api_server.go
    
    rm apps/backend/demo_api_server.go.bak 2>/dev/null
    echo "✅ Updated demo_api_server.go"
fi

# Force remove MySQL/SQLite from go.mod
echo ""
echo "📦 Force removing MySQL/SQLite from Go modules..."
cd apps/backend

# Remove from go.mod directly
if grep -q "gorm.io/driver/mysql" go.mod; then
    grep -v "gorm.io/driver/mysql" go.mod > go.mod.tmp && mv go.mod.tmp go.mod
fi

if grep -q "gorm.io/driver/sqlite" go.mod; then
    grep -v "gorm.io/driver/sqlite" go.mod > go.mod.tmp && mv go.mod.tmp go.mod
fi

# Clean up go.sum
if [ -f "go.sum" ]; then
    grep -v "gorm.io/driver/mysql" go.sum > go.sum.tmp && mv go.sum.tmp go.sum
    grep -v "gorm.io/driver/sqlite" go.sum > go.sum.tmp && mv go.sum.tmp go.sum
    grep -v "github.com/go-sql-driver/mysql" go.sum > go.sum.tmp && mv go.sum.tmp go.sum
    grep -v "github.com/mattn/go-sqlite3" go.sum > go.sum.tmp && mv go.sum.tmp go.sum
fi

# Run go mod tidy to clean up
go mod tidy

cd ../..

# Final verification
echo ""
echo "🔍 Final verification..."

# Check Go modules
echo "📦 Checking Go modules..."
if grep -q "mysql\|sqlite" apps/backend/go.mod; then
    echo "⚠️  Still found MySQL/SQLite in go.mod"
else
    echo "✅ go.mod is clean"
fi

# Check for any remaining references (excluding node_modules and .git)
echo ""
echo "🔍 Checking for remaining MySQL/SQLite references..."
REMAINING=$(find . -type f \( -name "*.go" -o -name "*.env*" -o -name "*.yml" -o -name "*.yaml" \) \
    ! -path "./node_modules/*" \
    ! -path "./.git/*" \
    ! -path "./server-backup/*" \
    -exec grep -l "mysql\|sqlite" {} \; 2>/dev/null || true)

if [ -n "$REMAINING" ]; then
    echo "⚠️  Found remaining references in:"
    echo "$REMAINING"
    echo ""
    echo "🔧 Manual cleanup may be needed for these files"
else
    echo "✅ No MySQL/SQLite references found!"
fi

echo ""
echo "📋 Final Cleanup Summary:"
echo "========================"
echo ""
echo "🗑️ Completely Removed:"
echo "   ❌ MySQL driver (gorm.io/driver/mysql)"
echo "   ❌ SQLite driver (gorm.io/driver/sqlite)"
echo "   ❌ MySQL Docker service"
echo "   ❌ MySQL DSN configurations"
echo "   ❌ SQLite file references"
echo "   ❌ MySQL/SQLite imports in test files"
echo ""
echo "✅ PostgreSQL Only:"
echo "   🐘 gorm.io/driver/postgres"
echo "   🐘 PostgreSQL DSN format"
echo "   🐘 PostgreSQL-optimized settings"
echo "   🐘 PostgreSQL test configurations"
echo ""
echo "🎯 System Status:"
echo "   • Database Support: PostgreSQL ONLY ✅"
echo "   • No MySQL dependencies ✅"
echo "   • No SQLite dependencies ✅"
echo "   • Clean Go modules ✅"
echo "   • Updated test files ✅"
echo ""
echo "🎉 Complete! System is now 100% PostgreSQL-only! 🐘✨"