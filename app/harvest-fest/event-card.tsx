"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { LinkifyText } from "@/components/linkify-text";
import { ImageLightbox } from "@/components/seeds/image-lightbox";
import type { HarvestFestEvent } from "@/lib/db/queries/settings";
import { cn } from "@/lib/utils";

function splitDate(date: string): { month: string; day: string } | null {
  const match = date.trim().match(/^(\S+)\s+(\S+)$/);
  if (!match) return null;
  return { month: match[1].slice(0, 3).toUpperCase(), day: match[2] };
}

// Roughly the length a description can reach before it stops fitting two
// lines at this card's width -- a heuristic, not a pixel measurement, since
// this is a simple admin-curated flyer rather than something worth adding
// client-side overflow measurement for.
const DESCRIPTION_CLAMP_THRESHOLD = 160;

export function HarvestFestEventCard({ event }: { event: HarvestFestEvent }) {
  const [expanded, setExpanded] = useState(false);
  const parsedDate = splitDate(event.date);
  const isDescriptionLong =
    event.description.trim().length > DESCRIPTION_CLAMP_THRESHOLD;
  const hasMore = Boolean(
    event.details?.trim() || event.imageUrls?.length || isDescriptionLong,
  );

  return (
    <li className="rounded-lg border p-4 sm:p-5">
      <div className="flex gap-4 sm:gap-5">
        <div className="bg-accent flex size-14 shrink-0 flex-col items-center justify-center rounded-lg leading-none">
          {parsedDate ? (
            <>
              <span className="text-primary text-[0.65rem] font-bold tracking-wide uppercase">
                {parsedDate.month}
              </span>
              <span className="mt-0.5 text-lg font-extrabold tabular-nums">
                {parsedDate.day}
              </span>
            </>
          ) : (
            <span className="text-primary px-1 text-center text-xs font-bold break-words">
              {event.date}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-semibold break-words">{event.title}</h3>
            {event.time && (
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {event.time}
              </span>
            )}
          </div>
          {event.location && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm break-words">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {event.location}
            </p>
          )}
          {event.description && (
            <p
              className={cn(
                "mt-2 text-sm break-words whitespace-pre-wrap",
                isDescriptionLong && !expanded && "line-clamp-2",
              )}
            >
              <LinkifyText text={event.description} />
            </p>
          )}
          {(event.projectId || hasMore) && (
            <div className="mt-2 flex items-center justify-between gap-3">
              {event.projectId && event.projectName ? (
                <Link
                  href={`/seeds/${event.projectId}`}
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  See the seed that sprouted
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              ) : (
                <span />
              )}

              {hasMore && (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  aria-expanded={expanded}
                  className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  {expanded ? "Show less" : "Learn more"}
                  {expanded ? (
                    <ChevronUp className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          )}

          {expanded && (
            <div className="mt-3 space-y-3 border-t pt-3">
              {event.details && (
                <p className="text-sm break-words whitespace-pre-wrap">
                  <LinkifyText text={event.details} />
                </p>
              )}
              {event.imageUrls && event.imageUrls.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {event.imageUrls.map((url, i) => (
                    <ImageLightbox
                      key={i}
                      src={url}
                      alt={`${event.title} photo ${i + 1}`}
                      natural
                      triggerClassName="bg-muted w-full rounded-md"
                      thumbClassName="max-h-64"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
