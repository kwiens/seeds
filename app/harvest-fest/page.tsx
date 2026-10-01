import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getHarvestFestPage } from "@/lib/db/queries/settings";

export const metadata: Metadata = {
  title: "Harvest Fest | Seeds — Chattanooga National Park City",
  description:
    "Harvest Fest is a chance to come together and experience what's growing across Chattanooga National Park City.",
};

function splitDate(date: string): { month: string; day: string } | null {
  const match = date.trim().match(/^(\S+)\s+(\S+)$/);
  if (!match) return null;
  return { month: match[1].slice(0, 3).toUpperCase(), day: match[2] };
}

export default async function HarvestFestPage() {
  const page = await getHarvestFestPage();
  const hasContent = page.title.trim().length > 0;

  return (
    <div>
      <section className="bg-[#2D5334] text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          {page.tagline && (
            <p className="mb-3 text-sm font-semibold tracking-widest text-[#74BB23] uppercase">
              {page.tagline}
            </p>
          )}
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            {hasContent ? page.title : "Harvest Fest"}
          </h1>
          {page.intro && (
            <p className="max-w-2xl text-lg whitespace-pre-wrap text-white/85">
              {page.intro}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Events</h2>

        {page.events.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Check back soon for Harvest Fest events.
          </p>
        ) : (
          <ul className="space-y-6">
            {page.events.map((event, index) => {
              const parsedDate = splitDate(event.date);
              return (
                <li
                  key={index}
                  className="flex gap-4 rounded-lg border p-4 sm:gap-5 sm:p-5"
                >
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
                      <h3 className="font-semibold break-words">
                        {event.title}
                      </h3>
                      {event.time && (
                        <span className="text-muted-foreground text-sm whitespace-nowrap">
                          {event.time}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm break-words">
                        <MapPin
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {event.location}
                      </p>
                    )}
                    {event.description && (
                      <p className="mt-2 text-sm break-words whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
