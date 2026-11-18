import { NextResponse, type NextRequest } from "next/server";

/**
 * Verificación optimista: sin cookie de sesión no se entra a /admin.
 * La validación real (firma y expiración) ocurre en cada página y Server Action con requireAdmin().
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("nuvex_admin")) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
