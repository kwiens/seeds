import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { SeedIcon, type SeedIconName } from "@/components/icons/seed-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { categories, categoryKeys } from "@/config/categories";
import { aboutContent } from "@/config/content/about";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

export const metadata: Metadata = aboutContent.metadata;

// The anatomy of a Seed is part of the product, not the city, so it lives here
// rather than in config. The `id`s are link targets from the project form.
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
  { label: "Soil", description: "Where is this seed planted?", icon: "soil" },
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

export default function AboutPage() {
  const { hero, whatAreSeeds, commitments, timeline, howToHelp } = aboutContent;

  return (
    <div>
      <section className="bg-brand-hero text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-hero-accent">
            {hero.eyebrow}
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            {hero.title}
          </h1>
          <p className="max-w-2xl text-lg text-white/85">{hero.intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tight">
            What Are Seeds?
          </h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {whatAreSeeds.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <Separator className="my-10" />

        <section id="every-seed-has">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Every Seed Has
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {seedTraits.map((trait) => (
              <div
                key={trait.label}
                id={`seed-${trait.label.toLowerCase()}`}
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

        <section>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">
            {commitments.title}
          </h2>
          <p className="text-muted-foreground mb-6">{commitments.intro}</p>
          <div className="space-y-6">
            {categoryKeys.map((key) => {
              const cat = categories[key];
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
                  {cat.principle && (
                    <p className="text-muted-foreground mb-1 text-sm italic">
                      {cat.principle}
                    </p>
                  )}
                  {cat.commitment && (
                    <p className="text-sm">{cat.commitment}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {timeline.steps.length > 0 && (
          <>
            <Separator className="my-10" />
            <section>
              <h2 className="mb-2 text-2xl font-bold tracking-tight">
                {timeline.title}
              </h2>
              <p className="text-muted-foreground mb-6">{timeline.intro}</p>
              <div className="space-y-4">
                {timeline.steps.map((step, i) => (
                  <div key={step.phase} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-step text-sm font-bold text-white">
                        {i + 1}
                      </div>
                      {i < timeline.steps.length - 1 && (
                        <div className="my-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      {step.cancelled && (
                        <p className="text-sm font-semibold text-destructive">
                          {step.cancelled}
                        </p>
                      )}
                      <div
                        className={cn(
                          step.cancelled && "line-through opacity-60",
                        )}
                      >
                        <p className="font-semibold">{step.phase}</p>
                        <p className="text-muted-foreground text-sm">
                          <Calendar className="mr-1 inline size-3.5 align-text-bottom" />
                          {step.when}
                        </p>
                        {step.location && (
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
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <Separator className="my-10" />

        <section className="flex flex-col items-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">
            {howToHelp.title}
          </h2>
          <ol className="text-muted-foreground mb-8 max-w-lg list-decimal space-y-2 pl-5 text-left text-sm">
            {howToHelp.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <Button size="lg" asChild>
            <Link href={routes.newProject}>
              Plant a Seed
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
