"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { Check, ImagePlus, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);

    for (const file of toUpload) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} exceeds 5 MB limit.`);
        return;
      }
    }

    setError(null);
    setUploading(true);

    // Track accumulated URLs so each successful upload is preserved
    // even if a later upload in the batch fails
    let current = photos;
    try {
      for (const file of toUpload) {
        const blob = await upload("seeds/photos/photo", file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        current = [...current, blob.url];
        onPhotosChange(current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    if (photos[index] === coverPhotoUrl) {
      onCoverPhotoChange(null);
    }
    onPhotosChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ImagePlus className="size-4" />
        Photos
        <span className="font-normal text-muted-foreground">
          (optional, up to {MAX_PHOTOS})
        </span>
      </Label>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((url, index) => {
            const isCover = url === coverPhotoUrl;
            return (
              <div key={url} className="group relative">
                <Image
                  src={url}
                  alt={`Photo ${index + 1}`}
                  width={120}
                  height={120}
                  className={cn(
                    "size-28 rounded-lg border-2 object-cover",
                    isCover ? "border-primary" : "border-border",
                  )}
                />
                {isCover && (
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    <Check className="size-2.5" />
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all hover:bg-muted-foreground hover:text-background"
                >
                  <X className="size-3" />
                </button>
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
              </div>
            );
          })}
        </div>
      )}

      {photos.length < MAX_PHOTOS && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="mr-1.5 size-3.5" />
                Add Photos
              </>
            )}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
