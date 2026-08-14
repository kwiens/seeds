import { headers } from "next/headers";

export const CANONICAL_ORIGIN = "https://www.npcseeds.org";

// Links we hand out (QR codes, CSV exports) must point back at the host that
// served the request, so Preview deployments and local dev never link to
// Production data that doesn't exist there.
export async function getRequestOrigin(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host) return CANONICAL_ORIGIN;
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.")
        ? "http"
        : "https");
    return `${protocol}://${host}`;
  } catch {
    // Outside a request scope (tests, static generation): fall back to the
    // canonical production origin.
    return CANONICAL_ORIGIN;
  }
}
