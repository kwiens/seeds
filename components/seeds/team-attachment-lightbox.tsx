"use client";

import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mirrors components/seeds/image-lightbox.tsx's dialog pattern, but for a
// private Team attachment served through /api/team-files (same-origin,
// auth-checked) rather than a public Blob URL — so plain <img> is used
// instead of next/image, and an explicit Download action is added since the
// underlying route defaults to an inline (viewable) response for images.
export function TeamAttachmentLightbox({
  src,
  name,
}: {
  src: string;
  name: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="border-input block size-14 shrink-0 cursor-zoom-in overflow-hidden rounded-md border"
          aria-label={`View ${name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="size-full object-cover" />
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-fit max-w-[95vw] border-0 bg-transparent p-0 shadow-none sm:max-w-[95vw]"
      >
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            className="block max-h-[90vh] max-w-[95vw] rounded"
          />
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <a
              href={`${src}?download=1`}
              className="rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 focus:ring-2 focus:ring-white focus:outline-none"
              aria-label={`Download ${name}`}
            >
              <Download className="size-5" />
            </a>
            <DialogClose
              className="rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 focus:ring-2 focus:ring-white focus:outline-none"
              aria-label="Close"
            >
              <X className="size-5" />
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
