"use client";

import { useState } from "react";
import { ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regenerateSeedImage } from "@/lib/actions/generate-image";

export function RegenerateImageButton({
  seedId,
  hasImage,
  onImageGenerated,
}: {
  seedId: string;
  hasImage: boolean;
  onImageGenerated?: (url: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("generating");
    setErrorMessage(null);

    const result = await regenerateSeedImage(seedId);
    if (result.error) {
      setStatus("error");
      setErrorMessage(result.error);
    } else {
      setStatus("idle");
      if (result.imageUrl) {
        onImageGenerated?.(result.imageUrl);
      }
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={status === "generating"}
      >
        {status === "generating" ? (
          <>
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            Generating...
          </>
        ) : hasImage ? (
          <>
            <RefreshCw className="mr-1.5 size-3.5" />
            Regenerate Image
          </>
        ) : (
          <>
            <ImagePlus className="mr-1.5 size-3.5" />
            Generate Image
          </>
        )}
      </Button>
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
