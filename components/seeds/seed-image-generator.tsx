"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { generateProjectImage } from "@/lib/actions/generate-image";

export function SeedImageGenerator({ seedId }: { seedId: string }) {
  const [status, setStatus] = useState<"generating" | "done" | "error">(
    "generating",
  );
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    generateProjectImage(seedId).then((result) => {
      if (result.error) {
        setStatus("error");
      } else {
        setStatus("done");
      }
    });
  }, [seedId]);

  if (status === "done") return null;

  if (status === "error") {
    return (
      <p role="alert" className="mb-6 text-sm text-destructive">
        Couldn&apos;t generate an illustration — you can add photos or retry
        from Edit.
      </p>
    );
  }

  return (
    <div
      role="status"
      className="mb-6 flex items-center gap-2 rounded-lg border p-4"
    >
      <Loader2 className="size-5 animate-spin text-green-600" />
      <span className="text-muted-foreground text-sm">
        Generating illustration...
      </span>
    </div>
  );
}
