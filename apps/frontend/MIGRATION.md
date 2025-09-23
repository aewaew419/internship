# Next.js Migration Documentation

## Overview
This document outlines the migration from React/Vite to Next.js 14+ with App Router, implementing mobile-first responsive design while preserving all existing functionality.

## Dependencies Migrated

### Core Dependencies
- **React**: 19.1.0 (maintained)
- **Next.js**: 15.5.3 (new framework)
- **TypeScript**: ^5 (maintained)

### UI Libraries
- **@mui/material**: ^7.2.0 (Material-UI components)
- **@mui/icons-material**: ^7.2.0 (Material-UI icons)
- **@mui/x-date-pickers**: ^8.10.0 (Date picker components)
- **@emotion/react**: ^11.14.0 (CSS-in-JS for MUI)
- **@emotion/styled**: ^11.14.1 (Styled components for MUI)

### Form and Validation
- **formik**: ^2.4.6 (Form management)
- **yup**: ^1.7.0 (Schema validation)

### Charts and Visualization
- **chart.js**: ^4.5.0 (Chart library)
- **react-chartjs-2**: ^5.3.0 (React wrapper for Chart.js)
- **chartjs-plugin-datalabels**: ^2.2.0 (Chart.js plugin)

### Utilities
- **axios**: ^1.10.0 (HTTP client)
- **dayjs**: ^1.11.13 (Date manipulation)
- **react-dropzone**: ^14.3.8 (File upload)
- **sweetalert2**: ^11.23.0 (Alert dialogs)

### Styling
- **tailwindcss**: ^4 (CSS framework)
- **@tailwindcss/postcss**: ^4 (PostCSS plugin)

### Testing
- **jest**: ^29.7.0 (Testing framework)
- **@testing-library/react**: ^16.1.0 (React testing utilities)
- **@testing-library/jest-dom**: ^6.6.3 (Jest DOM matchers)
- **@testing-library/user-event**: ^14.5.2 (User interaction testing)

## Configuration Files

### Package.json Scripts
- `dev`: Next.js development server with Turbopack
- `build`: Production build with Turbopack
- `start`: Production server
- `lint`: ESLint with Next.js configuration
- `type-check`: TypeScript type checking
- `test`: Jest test runner

### Tailwind CSS Configuration
- Mobile-first breakpoints (xs: 320px, sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- Custom color palette from existing theme
- Touch-friendly spacing (44px minimum touch targets)
- Custom animations and transitions

### Next.js Configuration
- Image optimization with WebP/AVIF support
- Bundle optimization for MUI and Chart.js
- Security headers
- Compression enabled
- TypeScript and ESLint integration

### Testing Configuration
- Jest with Next.js integration
- jsdom test environment
- Path mapping for imports
- Mock setup for Next.js components

## Custom Theme Migration

### Color Palette
- Primary colors: 50-900 scale with orange/red theme
- Secondary colors: 50-900 scale with brown/gold theme
- Text colors: 50-900 scale for typography
- Background colors: Light theme optimized
- Utility colors: Error (#a01f38) and Success (#2f7b69)

### Typography
- Font family: "Bai Jamjuree" (preserved from original)
- Mobile-optimized font sizes and line heights
- Responsive typography scaling

### Custom CSS Classes
- `.gradient-text`: Text with gradient background
- `.bg-gradient`: Background gradient utility
- `.primary-button`: Primary button styling
- `.secondary-button`: Secondary button styling
- Table utilities (`.start-table`, `.table-body`)

## Mobile-First Responsive Features

### Layout System
- Container with responsive padding
- Mobile navigation overlay and sidebar
- Touch-friendly button sizing (44px minimum)
- Responsive table utilities with card fallbacks

### Accessibility
- Screen reader utilities (`.sr-only`)
- Focus-visible styles
- Proper ARIA attributes in components
- Touch target optimization

### Performance Optimizations
- Image optimization with Next.js Image component
- Bundle splitting for large libraries
- CSS optimization and minification
- Service worker ready configuration

## Environment Configuration
- Development and production environment variables
- API URL configuration
- Feature flags for analytics and PWA
- Image domain configuration

## Migration Benefits
1. **Performance**: Server-side rendering and automatic optimizations
2. **SEO**: Better search engine optimization capabilities
3. **Mobile Experience**: Mobile-first responsive design
4. **Developer Experience**: Hot reload, TypeScript integration, and modern tooling
5. **Bundle Optimization**: Automatic code splitting and tree shaking
6. **Image Optimization**: Automatic image optimization and lazy loading

## Next Steps
1. Migrate authentication system to Next.js middleware
2. Implement responsive layout components
3. Migrate existing pages to App Router structure
4. Add mobile-specific features and optimizations
5. Implement comprehensive testing for responsive design