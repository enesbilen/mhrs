import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes - only accessible by admins
    if (path.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // User routes - accessible by both admin and user
    if (
      (path.startsWith('/patients') ||
        path.startsWith('/anamnesis') ||
        path.startsWith('/diagnoses')) &&
      token?.role !== 'user' &&
      token?.role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/patients/:path*',
    '/anamnesis/:path*',
    '/diagnoses/:path*',
  ],
};
