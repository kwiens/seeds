"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useIsInAppBrowser } from "@/lib/hooks/use-is-in-app-browser";

export function SignInButton() {
  const isInAppBrowser = useIsInAppBrowser();

  if (isInAppBrowser) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Open in your browser to sign in</p>
        <p className="mt-1 text-amber-700">
          Google sign-in doesn&apos;t work inside app browsers. Tap the menu
          (&hellip;) and choose &ldquo;Open in Chrome&rdquo; or &ldquo;Open in
          Safari&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <Button type="button" onClick={() => signIn("google")} variant="default">
      Sign in with Google
    </Button>
  );
}
