"use client";

import { useEffect } from "react";
import { markSproutActivityRead } from "@/lib/actions/team-activity";

// Fires once per page view, client-side -- revalidatePath requires a real
// Server Action invocation, which a Server Component's render body can't do.
export function MarkSproutRead({
  seedId,
  readThrough,
}: {
  seedId: string;
  readThrough: string;
}) {
  useEffect(() => {
    markSproutActivityRead(seedId, readThrough);
  }, [seedId, readThrough]);

  return null;
}
