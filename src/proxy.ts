/**
 * THIS FILE MUST LIVE AT `src/proxy.ts`. DO NOT MOVE IT TO THE REPOSITORY ROOT.
 * ============================================================================
 * It sat at the root as `middleware.ts` until PCP-017, and Next.js silently ignored it there.
 * When the application lives under `src/`, Next resolves this convention at `src/` only — a
 * root-level file is not an error, it is simply never loaded. Nothing fails, nothing warns, and
 * every route this file protects answers 200 to anybody.
 *
 * That is what was happening. `/operations/*`, `/dealer/*` and `/buyer/*` — every operations
 * dashboard, every dealer portal, every buyer portal — were publicly reachable without a session.
 * The gate was written correctly and was not plugged in.
 *
 * It is worth knowing how it was found, because nothing else would have found it: the Editorial
 * Console was built on the assumption that this gate was its entire authorisation story, and the
 * first thing done after building it was to curl the route unauthenticated. It returned 200.
 *
 * The check is one command, and it belongs in any review that touches routing:
 *
 *     curl -s -o /dev/null -w '%{http_code}' http://localhost:3003/operations/dashboard   # 307
 *
 * The file is `proxy.ts` rather than `middleware.ts` because Next 16 deprecated and renamed the
 * convention; the build warns on the old name. Behaviour is unchanged — same matcher, same request
 * lifecycle, only the filename and the exported function name differ.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { hasAnyPermission, type Permission } from "@/config/architecture";
import { AUTH_USER_TYPE_COOKIE } from "@/features/authentication/constants";
import { resolveUserTypeFromUnknown } from "@/features/authentication/user-type";

type ProtectedPortal = "buyer" | "dealer" | "operations";

function getProtectedPortal(pathname: string): ProtectedPortal | null {
  if (pathname === "/buyer" || pathname.startsWith("/buyer/")) return "buyer";
  if (pathname === "/dealer" || pathname.startsWith("/dealer/")) return "dealer";
  if (pathname === "/operations" || pathname.startsWith("/operations/")) return "operations";
  return null;
}

function getRequiredPermissions(portal: ProtectedPortal): readonly Permission[] {
  if (portal === "dealer") return ["dealer:dashboard:view"];
  if (portal === "buyer") return ["buyer:dashboard:view"];
  return ["operations:view"];
}

function getAuthEntryPath(portal: ProtectedPortal): string {
  if (portal === "operations") return "/unauthorized";
  return "/auth/sign-in";
}

function redirectToAuth(request: NextRequest, portal: ProtectedPortal): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = getAuthEntryPath(portal);
  url.searchParams.set("portal", portal);
  url.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

function redirectToUnauthorized(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/unauthorized";
  url.search = "";
  return NextResponse.redirect(url);
}

/**
 * Local-only surfaces: routes that write to the working tree and therefore must not exist in a
 * deployed build.
 *
 * Enforced here rather than with `notFound()` inside the page, which does not work for a streamed
 * dynamic route: by the time the component runs, the 200 has been flushed, so the response answers
 * 200 with a not-found body. Middleware runs before any rendering and can answer honestly.
 */
const LOCAL_ONLY_PREFIXES = ["/admin/creative"] as const;

const isLocalOnly = (pathname: string): boolean =>
  LOCAL_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && isLocalOnly(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const portal = getProtectedPortal(request.nextUrl.pathname);
  if (!portal) {
    return NextResponse.next();
  }

  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  const roleCookie = request.cookies.get(AUTH_USER_TYPE_COOKIE)?.value;
  const userType = resolveUserTypeFromUnknown(roleCookie);

  if (!userType) {
    return redirectToAuth(request, portal);
  }

  const requiredPermissions = getRequiredPermissions(portal);
  if (!hasAnyPermission(userType, requiredPermissions)) {
    return redirectToUnauthorized(request);
  }

  const headers = new Headers(request.headers);
  headers.set("x-surf-return-to", returnTo);
  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: ["/dealer/:path*", "/buyer/:path*", "/operations/:path*", "/admin/creative/:path*"],
};
