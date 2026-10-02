"use client";

import Image from "next/image";
import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt: string;
  thumbWidth?: number;
  thumbHeight?: number;
  thumbClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Wrapper class for the trigger; defaults to rounded-2xl */
  triggerClassName?: string;
  /** Use `fill` on the thumbnail (parent must be positioned) */
  fill?: boolean;
  /** Serve `src` as-is, e.g. a private same-origin route Next can't optimize */
  unoptimized?: boolean;
  /** Adds a Download action beside Close in the open lightbox */
  downloadHref?: string;
  /**
   * Render the thumbnail at its real aspect ratio instead of cropping to
   * fill a fixed box -- for content where cropping would cut off real
   * information (a flyer's text, a QR code), not just decorative photos.
   * Scales down to fit `triggerClassName`'s max-height, nothing is cut off.
   */
  natural?: boolean;
}

export function ImageLightbox({
  src,
  alt,
  thumbWidth = 720,
  thumbHeight = 720,
  thumbClassName,
  sizes,
  priority,
  triggerClassName,
  fill,
  unoptimized,
  downloadHref,
  natural,
}: ImageLightboxProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "block cursor-zoom-in",
            !natural && "overflow-hidden",
            !fill && !natural && "rounded-2xl",
            natural && "flex items-center justify-center",
            triggerClassName,
          )}
          aria-label={`Open ${alt}`}
        >
          {natural ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className={cn(
                "h-auto max-h-[480px] w-auto max-w-full object-contain",
                thumbClassName,
              )}
            />
          ) : fill ? (
            <Image
              src={src}
              alt={alt}
              fill
              className={cn("object-cover", thumbClassName)}
              sizes={sizes}
              priority={priority}
              unoptimized={unoptimized}
            />
          ) : (
            <Image
              src={src}
              alt={alt}
              width={thumbWidth}
              height={thumbHeight}
              className={cn("h-auto w-full", thumbClassName)}
              sizes={sizes}
              priority={priority}
              unoptimized={unoptimized}
            />
          )}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-fit max-w-[95vw] border-0 bg-transparent p-0 shadow-none sm:max-w-[95vw]"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="block max-h-[90vh] max-w-[95vw] rounded"
          />
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            {downloadHref && (
              <a
                href={downloadHref}
                className={LIGHTBOX_ACTION_CLASS}
                aria-label={`Download ${alt}`}
              >
                <Download className="size-5" />
              </a>
            )}
            <DialogClose className={LIGHTBOX_ACTION_CLASS} aria-label="Close">
              <X className="size-5" />
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const LIGHTBOX_ACTION_CLASS =
  "rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 focus:ring-2 focus:ring-white focus:outline-none";
