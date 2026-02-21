"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { generateSeedImage } from "@/lib/actions/generate-image";

export function SeedImageGenerator({ seedId }: { seedId: string }) {
  const [status, setStatus] = useState<"generating" | "done" | "error">(
    "generating",
  );
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    generateSeedImage(seedId).then((result) => {
      if (result.error) {
        setStatus("error");
      } else {
        setStatus("done");
      }
    });
  }, [seedId]);

  if (status === "done") return null;

  if (status === "error") return null;

  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border p-4">
      <Loader2 className="size-5 animate-spin text-green-600" />
      <span className="text-muted-foreground text-sm">
        Generating illustration...
      </span>
    </div>
  );
}
