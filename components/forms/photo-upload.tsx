"use client";

import { Check, Star } from "lucide-react";
import { ImageUpload } from "@/components/forms/image-upload";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  coverPhotoUrl: string | null;
  onCoverPhotoChange: (url: string | null) => void;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  coverPhotoUrl,
  onCoverPhotoChange,
}: PhotoUploadProps) {
  function handleChange(updated: string[]) {
    // Clear cover if it was removed
    if (coverPhotoUrl && !updated.includes(coverPhotoUrl)) {
      onCoverPhotoChange(null);
    }
    onPhotosChange(updated);
  }

  return (
    <ImageUpload
      images={photos}
      onChange={handleChange}
      maxImages={5}
      getImageClassName={(url) =>
        url === coverPhotoUrl ? "border-primary" : undefined
      }
      renderOverlay={(url) => {
        const isCover = url === coverPhotoUrl;
        return (
          <>
            {isCover && (
              <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                <Check className="size-2.5" />
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => onCoverPhotoChange(isCover ? null : url)}
              title={isCover ? "Remove as cover" : "Use as cover"}
              className={cn(
                "absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border shadow-sm transition-all",
                isCover
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted-foreground hover:text-background",
              )}
            >
              <Star
                className="size-3"
                fill={isCover ? "currentColor" : "none"}
              />
            </button>
          </>
        );
      }}
    />
  );
}
