import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Signed-out visitors to private routes go to sign-in and come back to the
// page they asked for. Role checks happen in the pages themselves.
export const proxy = auth((req) => {
  if (!req.auth) {
    const signIn = new URL("/api/auth/signin", req.url);
    signIn.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
