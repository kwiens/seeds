import Image from "next/image";
import { ImageLightbox } from "@/components/seeds/image-lightbox";

interface PhotoGridProps {
  photos: string[];
  alt: string;
  /** "default" = grid with lightbox, "sm" = compact inline thumbnails (no lightbox) */
  size?: "default" | "sm";
}

export function PhotoGrid({ photos, alt, size = "default" }: PhotoGridProps) {
  if (photos.length === 0) return null;

  if (size === "sm") {
    return (
      <div className="flex gap-1.5">
        {photos.map((url, i) => (
          <div
            key={url}
            className="relative size-28 shrink-0 overflow-hidden rounded-md"
          >
            <Image
              src={url}
              alt={`${alt} photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {photos.map((url, i) => (
        <div
          key={url}
          className="relative aspect-square overflow-hidden rounded-lg"
        >
          <ImageLightbox
            src={url}
            alt={`${alt} photo ${i + 1}`}
            fill
            sizes="(max-width: 768px) 33vw, 280px"
            triggerClassName="absolute inset-0"
          />
        </div>
      ))}
    </div>
  );
}
