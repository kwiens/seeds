"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages: number;
  label?: string;
  /** Extra CSS class for individual thumbnail images (e.g. cover photo border) */
  getImageClassName?: (url: string) => string | undefined;
  /** Render extra overlay UI on each thumbnail (e.g. cover photo star) */
  renderOverlay?: (url: string, index: number) => React.ReactNode;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onChange,
  maxImages,
  label = "Photos",
  getImageClassName,
  renderOverlay,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxImages} photos allowed.`);
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

    let current = images;
    try {
      for (const file of toUpload) {
        const blob = await upload("seeds/photos/photo", file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        current = [...current, blob.url];
        onChange(current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <ImagePlus className="size-4" />
        {label}
        <span className="font-normal text-muted-foreground">
          (optional, up to {maxImages})
        </span>
      </Label>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div key={url} className="group relative">
              <Image
                src={url}
                alt={`Photo ${index + 1}`}
                width={120}
                height={120}
                className={cn(
                  "size-28 rounded-lg border-2 border-border object-cover",
                  getImageClassName?.(url),
                )}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={disabled}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all hover:bg-muted-foreground hover:text-background"
              >
                <X className="size-3" />
              </button>
              {renderOverlay?.(url, index)}
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading || disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || disabled}
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
