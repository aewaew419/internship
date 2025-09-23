# Getting Started

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd internship-management

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Development

```bash
# Start all applications in development mode
pnpm dev

# Start specific application
pnpm --filter @internship/frontend dev
pnpm --filter @internship/backend dev
```

## Package Structure

- `apps/` - Applications (frontend, backend)
- `packages/` - Shared packages (types, components, utils)
- `tools/` - Development tools and configurations
- `docs/` - Documentation

## Available Scripts

- `pnpm dev` - Start all applications
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean all build outputs