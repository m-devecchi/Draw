import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/auth/cognito";
import {
  ACCESS_COOKIE,
  ID_COOKIE,
  REFRESH_COOKIE,
  writeSession,
} from "@/lib/auth/session";
import { verifyIdToken } from "@/lib/auth/tokens";
import { isDemoMode } from "@/lib/config";

// Rotte raggiungibili senza login.
const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/api/auth",
  "/api/billing/webhook",
  "/manifest.webmanifest",
];

export async function middleware(request: NextRequest) {
  // Modalità PoC (backend non configurato): nessuna autenticazione.
  if (isDemoMode()) {
    if (request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const idToken = request.cookies.get(ID_COOKIE)?.value;
  let user = idToken ? await verifyIdToken(idToken) : null;

  // Token scaduto: si rinfresca col refresh token (valido ~30 giorni).
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!user && refreshToken) {
    try {
      const tokens = await refreshSession(refreshToken);
      user = await verifyIdToken(tokens.idToken);
      if (user) {
        // La richiesta in corso vede subito i token nuovi; il browser li
        // riceve con la risposta.
        request.cookies.set(ID_COOKIE, tokens.idToken);
        request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
        response = NextResponse.next({ request });
        writeSession(response.cookies, tokens);
      }
    } catch {
      // Refresh token scaduto o revocato: si torna al login.
    }
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!user && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Tutto tranne asset statici e file di Next.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|icons/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|webmanifest|js\\.map)$).*)",
  ],
};
