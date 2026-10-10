import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Sprout, Sun, Trees } from "lucide-react";
import { SeedIcon } from "@/components/icons/seed-icons";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { categories, categoryKeys } from "@/config/categories";
import { type FaqSection, faqContent } from "@/config/content/faq";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = faqContent.metadata;

const heroIcons = [
  { Icon: Sprout, color: "text-brand-hero-accent" },
  { Icon: Sun, color: "text-amber-400" },
  { Icon: Trees, color: "text-emerald-400" },
];

export default function FaqPage() {
  const { hero, sections, commitments, contact } = faqContent;

  return (
    <div>
      <section className="bg-brand-hero text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          <div className="mb-6 flex items-center gap-4">
            {heroIcons.map(({ Icon, color }) => (
              <div
                key={color}
                className="flex size-12 items-center justify-center rounded-xl bg-white/15"
              >
                <Icon className={cn("size-6", color)} />
              </div>
            ))}
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-hero-accent-soft">
            {hero.eyebrow}
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            {hero.title}
          </h1>
          <p className="max-w-2xl text-lg text-white/85">{hero.intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {sections.map((section, i) => (
          <div key={section.title}>
            {i > 0 && <Separator className="my-10" />}
            <FaqSectionBlock
              section={section}
              prefix={`${section.icon}-${i}`}
            />
          </div>
        ))}

        <Separator className="my-10" />

        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tight">
            {commitments.title}
          </h2>
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            {categoryKeys.map((key) => {
              const cat = categories[key];
              const Icon = cat.icon;
              return (
                <div
                  key={key}
                  className="flex w-36 flex-col items-center rounded-xl border bg-card p-3 text-center"
                >
                  <div
                    className={cn(
                      "mb-2 flex size-9 items-center justify-center rounded-lg",
                      cat.bgClass,
                    )}
                  >
                    <Icon className={cn("size-5", cat.textClass)} />
                  </div>
                  <p className="text-xs font-medium">{cat.label}</p>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground text-sm">
            We use the{" "}
            <Link href="/about" className="text-primary underline">
              simple, proven principles of nature
            </Link>{" "}
            {commitments.outro}
          </p>
        </section>

        <Separator className="my-10" />

        <section className="flex flex-col items-center text-center">
          <SeedIcon name="water" size={48} className="mb-4" />
          <h2 className="mb-2 text-2xl font-bold tracking-tight">
            {contact.title}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            {contact.intro}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/about">About</Link>
            </Button>
            <Button asChild>
              <a href={`mailto:${siteConfig.contactEmail}`}>
                <Mail className="mr-2 size-4" />
                Email Us
              </a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function FaqSectionBlock({
  section,
  prefix,
}: {
  section: FaqSection;
  prefix: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <SeedIcon name={section.icon} size={32} />
        <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
      </div>
      <Accordion type="multiple" className="w-full">
        {section.faqs.map((faq, i) => (
          <AccordionItem key={faq.question} value={`${prefix}-${i}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
