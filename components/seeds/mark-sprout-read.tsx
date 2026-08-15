"use client";

import { useEffect } from "react";
import { markProjectActivityRead } from "@/lib/actions/team-activity";

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
    markProjectActivityRead(seedId, readThrough);
  }, [seedId, readThrough]);

  return null;
}
