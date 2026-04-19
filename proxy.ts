import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  console.log(`[Proxy] ${request.method} ${pathname}`);

  // Skip proxy entirely for static assets
  if (pathname.startsWith("/_next/static") || pathname.startsWith("/_next/image")) {
    return NextResponse.next();
  }

  // Webhooks externos: nunca exigem auth e devem passar sem qualquer interceptação
  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login", 
    "/auth/callback", 
    "/offline", 
    "/reset-password",
    "/termos",
    "/privacidade",
    "/planos", // Página de planos - pode ser acessada sem login
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (importante para mobile)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // For API routes, just refresh the session and continue (don't redirect)
  if (pathname.startsWith("/api")) {
    return response;
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access login page, redirect to home
  if (user && pathname === "/login") {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (manifest, sw.js, images)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js)$).*)",
  ],
};
