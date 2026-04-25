"use client";

import Image from "next/image";
import { X } from "lucide-react";
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
}: ImageLightboxProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "block cursor-zoom-in overflow-hidden",
            !fill && "rounded-2xl",
            triggerClassName,
          )}
          aria-label={`Open ${alt}`}
        >
          {fill ? (
            <Image
              src={src}
              alt={alt}
              fill
              className={cn("object-cover", thumbClassName)}
              sizes={sizes}
              priority={priority}
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
          <DialogClose
            className="absolute top-2 right-2 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 focus:ring-2 focus:ring-white focus:outline-none"
            aria-label="Close"
          >
            <X className="size-5" />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
