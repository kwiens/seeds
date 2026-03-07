"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export function PhotoUpload({ photos, onPhotosChange }: PhotoUploadProps) {
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

    try {
      const newUrls: string[] = [];
      for (const file of toUpload) {
        const blob = await upload("seeds/photos/photo", file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        newUrls.push(blob.url);
      }
      onPhotosChange([...photos, ...newUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
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
          {photos.map((url, index) => (
            <div key={url} className="group relative">
              <Image
                src={url}
                alt={`Photo ${index + 1}`}
                width={120}
                height={120}
                className="size-28 rounded-lg border object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm opacity-0 transition-all hover:bg-muted-foreground hover:text-background group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
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
