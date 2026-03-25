import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Sprout, Sun, Trees } from "lucide-react";
import { SeedIcon, type SeedIconName } from "@/components/icons/seed-icons";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { categories, categoryKeys } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FAQ | Seeds — Chattanooga National Park City",
  description:
    "Frequently asked questions about Seeds, Chattanooga National Park City, and how to get involved.",
};

const faqSections: {
  title: string;
  icon: SeedIconName;
  faqs: { question: string; answer: string }[];
}[] = [
  {
    title: "Getting Started",
    icon: "soil",
    faqs: [
      {
        question: "What is a National Park City?",
        answer:
          "A National Park City is a large-scale vision for making a city greener, healthier, and wilder. London became the first in 2019. Chattanooga is the first in the United States — treating our entire region as a living park to protect, enjoy, and improve together.",
      },
      {
        question: "What are Seeds?",
        answer:
          "Seeds are place-based, actionable community projects that require collaboration. They can be anything from a backyard garden to a bike corridor to public art. Seeds with the most community support get planted, and successful ones can spread across the region.",
      },
      {
        question: "Who can plant a Seed?",
        answer:
          "Anyone! Individuals, community groups, nonprofits, businesses, and neighborhood associations can all submit Seed ideas. You just need a clear idea, a location, and the willingness to collaborate with others to make it happen.",
      },
      {
        question: "Does it cost anything to submit a Seed?",
        answer:
          "No. Planting a Seed is completely free. Just create an account, fill out the form describing your idea, and submit it for the community to see and support.",
      },
      {
        question: "What happens after I plant a Seed?",
        answer:
          "Your Seed will be reviewed and published on the site. Community members can then show their support. Seeds with strong community backing move forward to workshops and pitch events where they can receive mentorship, resources, and funding.",
      },
    ],
  },
  {
    title: "Seeds & The Process",
    icon: "gardeners",
    faqs: [
      {
        question: "What makes a strong Seed?",
        answer:
          "A strong Seed has a clear idea (Name), committed people (Gardeners), a specific location (Soil), identified resources needed (Water), enthusiastic supporters (Sunlight), connections to existing efforts (Roots), organizations that can help (Support), and a vision for success (Harvest).",
      },
      {
        question: "What are the Five Commitments?",
        answer:
          "Every Seed aligns with one of five commitments: Everyday Access, Outdoor Play, Balanced Growth, Respect, and Connected Communities. These principles — inspired by nature — guide our work toward a healthier, more connected city.",
      },
      {
        question: "How are Seeds selected for funding?",
        answer:
          "Seeds go through a multi-step process: community support gathering, workshops for refinement, and a pitch event where teams present to the community. Seeds that demonstrate strong collaboration, community impact, and feasibility receive funding and resources.",
      },
      {
        question: "Can a Seed be located anywhere in the region?",
        answer:
          "Yes! Seeds can be planted anywhere in Chattanooga, Hamilton County, or the surrounding communities within roughly 50 miles of downtown. The key is that the project has a specific place where it will take root.",
      },
    ],
  },
  {
    title: "Supporting Seeds",
    icon: "support",
    faqs: [
      {
        question: "How do I support a Seed?",
        answer:
          "Visit any Seed's detail page and click the support button. This lets the Seed team know their idea has community backing. The more supporters a Seed has, the stronger its case for resources and funding.",
      },
      {
        question: "Can I support more than one Seed?",
        answer:
          "Absolutely! Support as many Seeds as you believe in. There's no limit.",
      },
      {
        question: "What if I want to do more than just support?",
        answer:
          "You can get involved directly by reaching out to Seed gardeners, attending workshops and events, mentoring teams, or offering resources. Check the About page for upcoming events where you can connect in person.",
      },
    ],
  },
  {
    title: "Your Account",
    icon: "harvest",
    faqs: [
      {
        question: "How do I create an account?",
        answer:
          'Click "Sign in" in the top right corner and sign in with your Google account. That\'s it — your account is created automatically.',
      },
      {
        question: "Can I edit my Seed after submitting?",
        answer:
          "Yes. Go to your dashboard (My Seeds) and you'll find an edit option for each of your Seeds. You can update details at any time.",
      },
      {
        question: "How do I see Seeds I've supported?",
        answer:
          "Visit your dashboard to see both the Seeds you've planted and the ones you've supported.",
      },
    ],
  },
];

const heroIcons = [
  { Icon: Sprout, color: "text-[#74BB23]" },
  { Icon: Sun, color: "text-amber-400" },
  { Icon: Trees, color: "text-emerald-400" },
];

function FaqSection({
  title,
  icon,
  faqs,
  prefix,
}: {
  title: string;
  icon: SeedIconName;
  faqs: { question: string; answer: string }[];
  prefix: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <SeedIcon name={icon} size={32} />
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      <Accordion type="multiple" className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`${prefix}-${i}`}>
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

export default function FaqPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#2D5334] text-white">
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
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#74BB23]">
            From Seeds to Sprouts
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="max-w-2xl text-lg text-white/85">
            Everything you need to know about Seeds, how they work, and how you
            can get involved in building Chattanooga&apos;s National Park City.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {faqSections.map((section, i) => (
          <div key={section.title}>
            {i > 0 && <Separator className="my-10" />}
            <FaqSection
              title={section.title}
              icon={section.icon}
              faqs={section.faqs}
              prefix={section.icon}
            />
          </div>
        ))}

        <Separator className="my-10" />

        {/* Five Commitments */}
        <section>
          <h2 className="mb-4 text-2xl font-bold tracking-tight">
            The Five Commitments
          </h2>
          <div className="mb-6 grid gap-3 sm:grid-cols-5">
            {categoryKeys.map((key) => {
              const cat = categories[key];
              const Icon = cat.icon;
              return (
                <div
                  key={key}
                  className="flex flex-col items-center rounded-xl border bg-card p-3 text-center"
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
            to guide our culture, our connections, and our growth.
          </p>
        </section>

        <Separator className="my-10" />

        {/* CTA */}
        <section className="flex flex-col items-center text-center">
          <SeedIcon name="water" size={48} className="mb-4" />
          <h2 className="mb-2 text-2xl font-bold tracking-tight">
            Still Have Questions?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            We can point you in the right direction.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/about">About</Link>
            </Button>
            <Button asChild>
              <a href="mailto:hello@nationalparkcitycha.org">
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
