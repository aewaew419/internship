#!/bin/bash

echo "🐘 PostgreSQL + Prisma Setup"
echo "============================"

# Check if we're in the right directory
if [ ! -f "apps/backend/prisma/schema.prisma" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Setup Options:"
echo "1. Local PostgreSQL (Docker)"
echo "2. Supabase (Cloud)"
echo "3. Railway (Cloud)"
echo "4. Manual setup"
read -p "Choose option (1-4): " OPTION

case $OPTION in
    1)
        echo "🐳 Setting up Local PostgreSQL with Docker..."
        
        # Create docker-compose for development
        cat > docker-compose.dev.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: internship_postgres_dev
    environment:
      POSTGRES_DB: internship_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_dev_data:
EOF

        # Create .env.local
        cat > apps/frontend/.env.local << 'EOF'
DATABASE_URL="postgresql://postgres:password@localhost:5432/internship_dev"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF

        echo "✅ Docker Compose created"
        echo "🚀 Starting PostgreSQL..."
        docker-compose -f docker-compose.dev.yml up -d
        
        echo "⏳ Waiting for PostgreSQL to start..."
        sleep 10
        ;;
        
    2)
        echo "☁️ Supabase Setup Instructions:"
        echo "1. Go to https://supabase.com"
        echo "2. Create new project"
        echo "3. Copy DATABASE_URL from Settings > Database"
        echo "4. Paste it below:"
        read -p "DATABASE_URL: " DATABASE_URL
        
        cat > apps/frontend/.env.local << EOF
DATABASE_URL="$DATABASE_URL"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF
        ;;
        
    3)
        echo "🚂 Railway Setup Instructions:"
        echo "1. Go to https://railway.app"
        echo "2. Create new project"
        echo "3. Add PostgreSQL service"
        echo "4. Copy DATABASE_URL from Variables tab"
        echo "5. Paste it below:"
        read -p "DATABASE_URL: " DATABASE_URL
        
        cat > apps/frontend/.env.local << EOF
DATABASE_URL="$DATABASE_URL"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF
        ;;
        
    4)
        echo "📝 Manual Setup:"
        echo "Please create apps/frontend/.env.local with:"
        echo 'DATABASE_URL="postgresql://username:password@host:5432/database"'
        echo 'NEXTAUTH_SECRET="your-secret-key"'
        echo 'NEXTAUTH_URL="http://localhost:3000"'
        ;;
esac

# Install Prisma if not installed
echo "📦 Installing Prisma..."
cd apps/frontend
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

# Add Prisma to package.json if not exists
if ! grep -q "@prisma/client" package.json; then
    echo "➕ Adding Prisma dependencies..."
    npm install @prisma/client
    npm install -D prisma
fi

# Add scripts to package.json
echo "📝 Adding Prisma scripts..."
npx json -I -f package.json -e 'this.scripts = this.scripts || {}'
npx json -I -f package.json -e 'this.scripts["db:generate"] = "prisma generate"'
npx json -I -f package.json -e 'this.scripts["db:push"] = "prisma db push"'
npx json -I -f package.json -e 'this.scripts["db:migrate"] = "prisma migrate dev"'
npx json -I -f package.json -e 'this.scripts["db:deploy"] = "prisma migrate deploy"'
npx json -I -f package.json -e 'this.scripts["db:studio"] = "prisma studio"'
npx json -I -f package.json -e 'this.scripts["db:seed"] = "node prisma/seed.js"'

# Copy Prisma schema to frontend
echo "📋 Copying Prisma schema..."
mkdir -p prisma
cp ../backend/prisma/schema.prisma prisma/

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "🗄️ Pushing schema to database..."
if npx prisma db push; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Failed to push schema. Please check your DATABASE_URL"
    exit 1
fi

# Create lib/prisma.js
echo "📚 Creating Prisma client..."
mkdir -p lib
cat > lib/prisma.js << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
EOF

# Create sample API route
echo "🔌 Creating sample API route..."
mkdir -p pages/api
cat > pages/api/users.js << 'EOF'
import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        take: 10,
        include: {
          student: true,
          instructor: true,
          staff: true
        }
      })
      res.status(200).json(users)
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: 'Failed to fetch users' })
    }
  } else if (req.method === 'POST') {
    try {
      const { email, password, firstName, lastName, role } = req.body
      const user = await prisma.user.create({
        data: {
          email,
          password, // In production, hash this!
          firstName,
          lastName,
          role
        }
      })
      res.status(201).json(user)
    } catch (error) {
      console.error('Database error:', error)
      res.status(500).json({ error: 'Failed to create user' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
EOF

# Create health check API
cat > pages/api/health.js << 'EOF'
import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    res.status(200).json({
      status: 'OK',
      message: 'Database connected successfully',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL + Prisma'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    })
  }
}
EOF

cd ..

echo ""
echo "🎉 PostgreSQL + Prisma Setup Complete!"
echo ""
echo "📋 What's been set up:"
echo "   ✅ PostgreSQL database"
echo "   ✅ Prisma schema (PostgreSQL)"
echo "   ✅ Prisma client generated"
echo "   ✅ Database schema pushed"
echo "   ✅ Sample API routes created"
echo ""
echo "🧪 Test your setup:"
echo "   cd apps/frontend"
echo "   npm run dev"
echo "   Visit: http://localhost:3000/api/health"
echo "   Visit: http://localhost:3000/api/users"
echo ""
echo "🛠️ Useful commands:"
echo "   npm run db:studio    # View database"
echo "   npm run db:generate  # Regenerate client"
echo "   npm run db:push      # Push schema changes"
echo ""
echo "🚀 Ready for development and production!"