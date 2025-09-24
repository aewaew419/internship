import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define role-based route access
const roleBasedRoutes = {
  '/instructor': ['instructor', 'committee', 'courseInstructor'],
  '/visitor': ['visitor'],
  '/admin': ['admin'],
  '/reports': ['instructor', 'committee', 'admin'],
  '/evaluate/company': ['student'],
} as const;

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/intern-request',
  '/instructor',
  '/visitor', 
  '/admin',
  '/reports',
  '/evaluate',
];

// Define public routes
const publicRoutes = ['/login', '/admin/login'];

// JWT validation helper
function validateJWT(token: string): { valid: boolean; payload?: any } {
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }

    // Decode payload (in production, you'd verify signature)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}

// Get user data from localStorage (stored in cookie for SSR)
function getUserFromRequest(request: NextRequest): any {
  try {
    const userCookie = request.cookies.get('user-data')?.value;
    if (!userCookie) return null;
    
    return JSON.parse(decodeURIComponent(userCookie));
  } catch (error) {
    return null;
  }
}

// Check if user has required role for route
function hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Get authentication data
  const token = request.cookies.get('auth-token')?.value;
  const user = getUserFromRequest(request);
  
  // Validate JWT token if present
  let isValidToken = false;
  if (token) {
    const validation = validateJWT(token);
    isValidToken = validation.valid;
  }
  
  // If accessing a protected route without valid authentication
  if (isProtectedRoute && (!token || !isValidToken || !user)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    // Clear invalid cookies
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth-token');
    response.cookies.delete('user-data');
    return response;
  }
  
  // Role-based access control for protected routes
  if (isProtectedRoute && user) {
    const userRoles = user.roles?.list || [];
    
    // Check specific role requirements for certain routes
    for (const [route, requiredRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!hasRequiredRole(userRoles, requiredRoles)) {
          // Redirect to dashboard if user doesn't have required role
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
  }
  
  // If accessing login page with valid authentication, redirect appropriately
  if (isPublicRoute && token && isValidToken && user) {
    const userRoles = user.roles?.list || [];
    
    if (pathname === '/login') {
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    
    if (pathname === '/admin/login') {
      // Check if user has admin role
      if (hasRequiredRole(userRoles, ['admin'])) {
        const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/admin';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      } else {
        // Not admin, redirect to admin login with access denied
        const adminLoginUrl = new URL('/admin/login', request.url);
        adminLoginUrl.searchParams.set('error', 'access_denied');
        return NextResponse.redirect(adminLoginUrl);
      }
    }
  }
  
  // If accessing root path with valid authentication, redirect to dashboard
  if (pathname === '/' && token && isValidToken && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Add CSRF protection header
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    if (origin && host && !origin.includes(host)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};