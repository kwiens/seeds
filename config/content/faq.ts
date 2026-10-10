/**
 * Copy for the FAQ page. Section icons come from the Seeds metaphor icon set
 * in `components/icons/seed-icons.tsx`.
 */
import type { SeedIconName } from "@/components/icons/seed-icons";

export interface FaqSection {
  title: string;
  icon: SeedIconName;
  faqs: { question: string; answer: string }[];
}

export interface FaqContent {
  metadata: { title: string; description: string };
  hero: { eyebrow: string; title: string; intro: string };
  sections: FaqSection[];
  commitments: { title: string; outro: string };
  contact: { title: string; intro: string };
}

export const faqContent: FaqContent = {
  metadata: {
    title: "FAQ",
    description:
      "Frequently asked questions about Seeds, Chattanooga National Park City, and how to get involved.",
  },
  hero: {
    eyebrow: "From Seeds to Sprouts",
    title: "Frequently Asked Questions",
    intro:
      "Everything you need to know about Seeds, how they work, and how you can get involved in building Chattanooga's National Park City.",
  },
  sections: [
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
            "Yes. Go to My Projects and open the My Seeds tab. You'll find an edit option for each of your Seeds and can update details at any time.",
        },
        {
          question: "How do I see Seeds I've supported?",
          answer:
            "Visit your dashboard to see both the Seeds you've planted and the ones you've supported.",
        },
      ],
    },
  ],
  commitments: {
    title: "The Five Commitments",
    outro: "to guide our culture, our connections, and our growth.",
  },
  contact: {
    title: "Still Have Questions?",
    intro: "We can point you in the right direction.",
  },
};
