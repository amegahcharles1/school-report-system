import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const url = req.nextUrl.pathname;
    
    // Admin only routes
    const adminRoutes = ['/settings', '/staff', '/subjects', '/classes'];
    
    // Check if the current path starts with any admin route
    const isAdminRoute = adminRoutes.some(route => url.startsWith(route));
    
    if (isAdminRoute && token?.role !== 'ADMIN') {
      // Redirect TEACHERs to the dashboard if they try to access admin pages
      return Response.redirect(new URL('/', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - login (the login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
