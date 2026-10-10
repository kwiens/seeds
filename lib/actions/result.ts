import type { ZodSafeParseResult } from "zod";

/**
 * The one shape every server action returns. The `?: undefined` members make
 * both branches readable without narrowing, so a component can write
 * `if (result.error)` or `if (result.success)` and TypeScript still knows
 * which branch it is in afterwards.
 */
export type ActionError = { error: string; success?: undefined };
export type ActionSuccess<T = Record<never, never>> = {
  success: true;
  error?: undefined;
} & T;
export type ActionResult<T = Record<never, never>> =
  | ActionError
  | ActionSuccess<T>;

export function isActionError(result: unknown): result is ActionError {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as ActionError).error === "string"
  );
}

/** The first validation message from a failed parse, or a fallback. */
export function firstIssue(
  parsed: ZodSafeParseResult<unknown>,
  fallback = "Invalid form data.",
): string {
  if (parsed.success) return fallback;
  return parsed.error.issues[0]?.message ?? fallback;
}
