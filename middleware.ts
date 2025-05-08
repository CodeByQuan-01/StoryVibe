import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Add security headers to all responses
  const response = NextResponse.next();

  // Content Security Policy - Updated to allow Google authentication AND Cloudinary
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: https://*.googleusercontent.com https://*.cloudinary.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://*.firebase.com https://*.firebaseapp.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://*.google.com https://api.cloudinary.com https://*.cloudinary.com https://*.cloudfunctions.net https://*.cloudflare.com; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; media-src 'self' blob: https://*.cloudinary.com;"
  );

  // XSS Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Frame Options
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
