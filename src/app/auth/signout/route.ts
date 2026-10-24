import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { globalSignOut } from "@/lib/auth/cognito";
import { ACCESS_COOKIE, clearSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (access) {
    // Revoca anche il refresh token; se fallisce si esce comunque.
    await globalSignOut(access).catch(() => {});
  }
  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 302,
  });
  clearSession(response.cookies);
  return response;
}
