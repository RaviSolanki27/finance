// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

const publicRoutes = ['/sign-in', '/sign-up', '/api/auth'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('expense-tracker-token')?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // Verify token
  const payload = await verifyToken(token);

  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    const response = NextResponse.redirect(url);
    // Clear invalid token
    response.cookies.delete('expense-tracker-token');
    return response;
  }

  // Add user info to request headers for API routes
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
