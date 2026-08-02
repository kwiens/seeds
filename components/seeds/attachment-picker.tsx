"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { discardTeamAttachment } from "@/lib/actions/team-updates";
import {
  TEAM_ATTACHMENT_MAX_FILES,
  TEAM_ATTACHMENT_MAX_SIZE,
} from "@/lib/constants";

export type Attachment = { name: string; url: string; size: number };

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
  onBusyChange,
  seedId,
  disabled,
}: {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  onBusyChange?: (busy: boolean) => void;
  seedId: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = TEAM_ATTACHMENT_MAX_FILES - attachments.length;
    if (remaining <= 0) {
      setError(`Maximum ${TEAM_ATTACHMENT_MAX_FILES} files allowed.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      if (file.size > TEAM_ATTACHMENT_MAX_SIZE) {
        setError(`${file.name} exceeds the 20 MB limit.`);
        return;
      }
    }

    setError(null);
    setUploading(true);
    onBusyChange?.(true);

    let current = attachments;
    try {
      for (const file of toUpload) {
        const blob = await upload(
          `seeds/${seedId}/attachments/${encodeURIComponent(file.name)}`,
          file,
          {
            access: "private",
            handleUploadUrl: "/api/upload",
            clientPayload: JSON.stringify({ seedId }),
          },
        );
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
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeAttachment(index: number) {
    const attachment = attachments[index];
    setError(null);
    setDeleting(true);
    onBusyChange?.(true);
    try {
      const result = await discardTeamAttachment(seedId, attachment);
      if (result.error) {
        setError(result.error);
        return;
      }
      onChange(attachments.filter((_, i) => i !== index));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Attachment deletion failed.",
      );
    } finally {
      setDeleting(false);
      onBusyChange?.(false);
    }
  }

  const busy = uploading || deleting;

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
                disabled={busy || disabled}
                aria-label={`Remove ${a.name}`}
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
        disabled={busy || disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={
          busy || disabled || attachments.length >= TEAM_ATTACHMENT_MAX_FILES
        }
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
