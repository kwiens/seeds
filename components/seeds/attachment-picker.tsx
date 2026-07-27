"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Attachment = { name: string; url: string; size: number };

const MAX_FILES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ACCEPTED =
  ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPicker({
  attachments,
  onChange,
  disabled,
}: {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_FILES} files allowed.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} exceeds the 20 MB limit.`);
        return;
      }
    }

    setError(null);
    setUploading(true);

    let current = attachments;
    try {
      for (const file of toUpload) {
        const blob = await upload(`seeds/attachments/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        current = [
          ...current,
          { name: file.name, url: blob.url, size: file.size },
        ];
        onChange(current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAttachment(index: number) {
    onChange(attachments.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <span
              key={a.url}
              className="bg-accent inline-flex max-w-[220px] items-center gap-1.5 rounded-full py-1 pr-1.5 pl-2.5 text-xs"
            >
              <Paperclip className="text-muted-foreground size-3 shrink-0" />
              <span className="truncate">{a.name}</span>
              <span className="text-muted-foreground shrink-0">
                {formatSize(a.size)}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading || disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading || disabled || attachments.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Paperclip className="mr-1.5 size-3.5" />
            Attach file
          </>
        )}
      </Button>

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
