#!/bin/bash

# Frontend Fix Script
# แก้ไขปัญหา Next.js chunk loading error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Frontend Chunk Loading Error...${NC}"
echo ""

# Stop any running frontend process
echo -e "${YELLOW}1. Stopping any running frontend processes...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# Clean Next.js cache and build files
echo -e "${YELLOW}2. Cleaning Next.js cache and build files...${NC}"
rm -rf apps/frontend/.next
rm -rf apps/frontend/.turbo
rm -rf apps/frontend/node_modules/.cache
rm -rf apps/frontend/out
rm -rf apps/frontend/dist

# Clean npm cache
echo -e "${YELLOW}3. Cleaning npm cache...${NC}"
npm cache clean --force 2>/dev/null || true

# Reinstall dependencies
echo -e "${YELLOW}4. Reinstalling frontend dependencies...${NC}"
cd apps/frontend
rm -rf node_modules package-lock.json
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Go back to root
cd ../..

# Create a simple restart script
echo -e "${YELLOW}5. Creating restart script...${NC}"
cat > restart-frontend.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Frontend..."

# Kill any existing processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
sleep 2

# Start frontend
cd apps/frontend
npm run dev &

# Wait a bit and check if it's running
sleep 5

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running at http://localhost:3000"
else
    echo "⚠️  Frontend may still be starting up..."
    echo "   Check manually at http://localhost:3000"
fi
EOF

chmod +x restart-frontend.sh

echo ""
echo -e "${GREEN}🎉 Frontend fix completed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run: ./restart-frontend.sh"
echo "2. Wait 10-15 seconds for Next.js to compile"
echo "3. Open: http://localhost:3000"
echo ""
echo -e "${YELLOW}If problems persist:${NC}"
echo "- Try restarting your terminal"
echo "- Check Node.js version: node --version"
echo "- Try: npm run build && npm run start in apps/frontend"