import { useSyncExternalStore } from "react";

/**
 * In-app browser tokens from Facebook, Instagram, Messenger, LinkedIn,
 * Twitter/X, Snapchat, TikTok, Line, WeChat, and generic WebView markers.
 */
const IN_APP_PATTERN =
  /FBAN|FBAV|FB_IAB|Instagram|Messenger|LinkedInApp|Twitter|Snapchat|TikTok|Line|MicroMessenger|WebView|wv\b/i;

function getSnapshot(): boolean {
  return IN_APP_PATTERN.test(navigator.userAgent);
}

function getServerSnapshot(): boolean {
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function subscribe(_cb: () => void): () => void {
  // User agent never changes — nothing to subscribe to.
  return () => {};
}

export function useIsInAppBrowser(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
