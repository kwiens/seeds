import type { Metadata } from "next";
import { LinkifyText } from "@/components/linkify-text";
import { getHarvestFestPage } from "@/lib/db/queries/settings";
import { HarvestFestEventCard } from "./event-card";

export const metadata: Metadata = {
  title: "Harvest Fest | Seeds — Chattanooga National Park City",
  description:
    "Harvest Fest is a chance to come together and experience what's growing across Chattanooga National Park City.",
};

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
              <LinkifyText text={page.intro} />
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
            {page.events.map((event, index) => (
              <HarvestFestEventCard key={index} event={event} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
