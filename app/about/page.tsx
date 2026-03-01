import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { SeedIcon, type SeedIconName } from "@/components/icons/seed-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { categories, categoryKeys, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About | Seeds — Chattanooga National Park City",
  description:
    "Chattanooga is the 1st National Park City in America. Learn how Seeds turn community ideas into action — and how you can help.",
};

const seedTraits: {
  label: string;
  description: string;
  icon: SeedIconName;
}[] = [
  {
    label: "Name",
    description: "What do people call this idea?",
    icon: "idea",
  },
  {
    label: "Gardeners",
    description: "Who is responsible for this seed?",
    icon: "gardeners",
  },
  {
    label: "Soil",
    description: "Where is this seed planted?",
    icon: "soil",
  },
  {
    label: "Water",
    description: "What resources are needed to grow?",
    icon: "water",
  },
  {
    label: "Sunlight",
    description: "Who has energy and excitement for it?",
    icon: "sunlight",
  },
  {
    label: "Roots",
    description: "What does this seed connect to?",
    icon: "roots",
  },
  {
    label: "Support",
    description: "Who can help this seed succeed?",
    icon: "support",
  },
  {
    label: "Harvest",
    description: "What do we hope to experience?",
    icon: "harvest",
  },
];

const timeline = [
  {
    phase: "Seed Drive Kickoff",
    when: "March 5",
    location: "iFixit, 812 E 12th St.",
    detail: "5PM–8PM. Public kickoff, open idea sharing, early teams form",
  },
  {
    phase: "Seed Workshop",
    when: "March 25",
    location: "Chatt Library, 1001 Broad St",
    detail:
      "4:30PM–7:30PM. Feedback, strengthening, mentor & nonprofit support",
  },
  {
    phase: "Seed Expo",
    when: "April 11",
    location: "Choo Choo, 1400 Market St.",
    detail: "11AM–7PM. Table-style expo, pitch practice, final collaborators",
  },
  {
    phase: "Seed Pitch Night",
    when: "April 24",
    location: "Studio Ours, 1401 Fort St.",
    detail:
      "6PM–9PM. Ticketed. 3-minute pitches, 20–30 Seeds, funding & support awarded",
  },
  {
    phase: "NPC Festival",
    when: "April 25",
    location: "Greenway Farm, 4960 Gann Store Rd.",
    detail: "Gear sale, seed pitch, music + more",
  },
  {
    phase: "Harvest",
    when: "Late Summer / Fall",
    detail: "Celebrate and enjoy the results of our labor",
  },
];

const commitmentDetails: Record<
  CategoryKey,
  { principle: string; commitment: string }
> = {
  daily_access: {
    principle:
      "Nature is open and accessible to all — the best aspects of a city should be too.",
    commitment:
      "We commit to making nature easy to access and part of everyday life for people of all ages and backgrounds.",
  },
  outdoor_play: {
    principle: "Nature is fun, joyful and beautiful — city life should be too.",
    commitment:
      "We commit to cultivating a culture that regularly experiences the fun, beauty, and wonder of the outdoors together.",
  },
  balanced_growth: {
    principle:
      "Nature grows in balance with the whole ecosystem — a city should grow the same way.",
    commitment:
      "We commit to guiding growth and development using the principles of healthy, thriving, self-sustaining ecosystems.",
  },
  respect: {
    principle:
      "Nature is a living system that must be understood and cared for as a whole — a city should be too.",
    commitment:
      "We commit to understanding, respecting, and preserving the unique ecology, history, and cultural roots of this place.",
  },
  connected_communities: {
    principle: "Nature thrives through connection — so does a city.",
    commitment:
      "We commit to strengthening connections between people, neighborhoods, wildlife, and local systems.",
  },
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#2D5334] text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#74BB23]">
            1st National Park City in America
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            Chattanooga National Park City
          </h1>
          <p className="max-w-2xl text-lg text-white/85">
            Our region — Chattanooga, Hamilton County, and the surrounding
            communities within roughly 50 miles of downtown — is becoming
            America&apos;s first National Park City. Our mission is to lead the
            world in improving quality of life for all of us by treating nature
            as our most valuable shared asset — today and for generations to
            come.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* What Are Seeds? */}
        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tight">
            What Are Seeds?
          </h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              Seeds are place-based, actionable projects that require
              collaboration from many groups. Backyard gardens, bike corridors,
              housing experiments, public art, neighborhood networks — and even
              major civic infrastructure — can all begin as Seeds.
            </p>
            <p>
              Seeds with the most community support get planted. Once
              successful, they can spread to other parts of our region with the
              benefit of shared learnings.
            </p>
          </div>
        </section>

        <Separator className="my-10" />

        {/* Every Seed Has */}
        <section>
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Every Seed Has
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {seedTraits.map((trait) => (
              <div
                key={trait.label}
                className="rounded-xl border bg-card p-4 text-center"
              >
                <div className="mb-3 flex justify-center">
                  <SeedIcon name={trait.icon} size={48} />
                </div>
                <p className="font-semibold">{trait.label}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {trait.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-10" />

        {/* Five Commitments */}
        <section>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">
            Five Commitments
          </h2>
          <p className="text-muted-foreground mb-6">
            We use the simple, proven principles of nature to guide our culture,
            our connections, and our growth.
          </p>
          <div className="space-y-6">
            {categoryKeys.map((key) => {
              const cat = categories[key];
              const detail = commitmentDetails[key];
              const Icon = cat.icon;
              return (
                <div key={key} className="rounded-xl border bg-card p-5">
                  <div className="mb-2 flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg",
                        cat.bgClass,
                      )}
                    >
                      <Icon className={cn("size-5", cat.textClass)} />
                    </div>
                    <h3 className="text-lg font-semibold">{cat.label}</h3>
                  </div>
                  <p className="text-muted-foreground mb-1 text-sm italic">
                    {detail.principle}
                  </p>
                  <p className="text-sm">{detail.commitment}</p>
                </div>
              );
            })}
          </div>
        </section>

        <Separator className="my-10" />

        {/* Seed Drive Timeline */}
        <section>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground mb-6">
            The National Park City Seed Drive: 100 Seeds from across the region.
          </p>
          <div className="space-y-4">
            {timeline.map((step, i) => (
              <div key={step.phase} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#3AAB9B] text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="my-1 w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-semibold">{step.phase}</p>
                  <p className="text-muted-foreground text-sm">
                    <Calendar className="mr-1 inline size-3.5 align-text-bottom" />
                    {step.when}
                  </p>
                  {"location" in step && step.location && (
                    <p className="text-muted-foreground text-sm">
                      <MapPin className="mr-1 inline size-3.5 align-text-bottom" />
                      {step.location}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1 text-sm">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-10" />

        {/* CTA */}
        <section className="flex flex-col items-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">
            How You Can Help
          </h2>
          <ol className="text-muted-foreground mb-8 max-w-lg list-decimal space-y-2 pl-5 text-left text-sm">
            <li>Bring your best ideas to the table</li>
            <li>Help spread the word in your community</li>
            <li>Join Seeds as a mentor or supporting organization</li>
            <li>Offer resources and funding for Seeds</li>
            <li>
              Make yourself available for a coffee conversation with Seed teams
            </li>
          </ol>
          <Button size="lg" asChild>
            <Link href="/seeds/new">
              Plant a Seed
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
