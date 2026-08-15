import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsInAppBrowser } from "@/lib/hooks/use-is-in-app-browser";

const originalUserAgent = navigator.userAgent;

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  setUserAgent(originalUserAgent);
});

describe("useIsInAppBrowser", () => {
  it("returns false for an ordinary desktop browser", () => {
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    );
    const { result } = renderHook(() => useIsInAppBrowser());
    expect(result.current).toBe(false);
  });

  it.each([
    ["Facebook", "Mozilla/5.0 [FBAN/FBIOS;FBAV/400.0]"],
    ["Facebook alternate token", "Mozilla/5.0 FBAV/1.0 FB_IAB/FB4A"],
    ["Instagram", "Mozilla/5.0 Instagram 275.0.0.27.98"],
    ["Messenger", "Mozilla/5.0 Messenger"],
    ["LinkedIn", "Mozilla/5.0 LinkedInApp"],
    ["Twitter/X", "Mozilla/5.0 Twitter for iPhone"],
    ["Snapchat", "Mozilla/5.0 Snapchat"],
    ["TikTok", "Mozilla/5.0 TikTok 26.2.0"],
    ["Line", "Mozilla/5.0 Line/11.0.0"],
    ["WeChat", "Mozilla/5.0 MicroMessenger/8.0"],
    ["generic WebView", "Mozilla/5.0 Version/4.0 WebView"],
    ["generic wv token", "Mozilla/5.0 (Linux; Android 10) wv) Chrome"],
  ])("returns true for %s in-app browsers", (_label, userAgent) => {
    setUserAgent(userAgent);
    const { result } = renderHook(() => useIsInAppBrowser());
    expect(result.current).toBe(true);
  });

  it("matches tokens case-insensitively", () => {
    setUserAgent("Mozilla/5.0 instagram lowercase-token");
    const { result } = renderHook(() => useIsInAppBrowser());
    expect(result.current).toBe(true);
  });

  it("recomputes when rerendered against a changed user agent", () => {
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    );
    const { result, rerender } = renderHook(() => useIsInAppBrowser());
    expect(result.current).toBe(false);

    setUserAgent("Mozilla/5.0 Instagram");
    rerender();
    expect(result.current).toBe(true);
  });
});
