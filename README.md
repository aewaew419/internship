# Internship Management System

A modern monorepo-based internship management system built with Next.js, Node.js, and shared TypeScript packages.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build
```

## 📁 Project Structure

```
internship-management/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # Node.js/Express API
├── packages/
│   ├── shared-types/      # TypeScript interfaces & types
│   ├── ui-components/     # Shared React components
│   ├── utils/             # Shared utilities
│   ├── config/            # Shared configurations
│   └── database/          # Database schemas & migrations
├── tools/
│   ├── build/             # Build scripts & configurations
│   ├── eslint-config/     # ESLint configurations
│   └── tsconfig/          # TypeScript configurations
└── docs/                  # Documentation
```

## 🛠️ Development

See [Getting Started Guide](./docs/development/getting-started.md) for detailed setup instructions.

## 📦 Packages

- **@internship/shared-types** - Shared TypeScript types and interfaces
- **@internship/ui-components** - Reusable React components
- **@internship/utils** - Utility functions
- **@internship/config** - Shared configurations
- **@internship/database** - Database schemas and migrations

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @internship/ui-components test
```

## 📚 Documentation

- [Getting Started](./docs/development/getting-started.md)
- [API Documentation](./docs/api/)
- [Deployment Guide](./docs/deployment/)