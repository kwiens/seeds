"use client";

import { useEffect } from "react";
import { markProjectActivityRead } from "@/lib/actions/team-activity";

// Fires once per page view, client-side -- revalidatePath requires a real
// Server Action invocation, which a Server Component's render body can't do.
export function MarkProjectActivityRead({
  projectId,
  readThrough,
}: {
  projectId: string;
  readThrough: string;
}) {
  useEffect(() => {
    markProjectActivityRead(projectId, readThrough);
  }, [projectId, readThrough]);

  return null;
}
