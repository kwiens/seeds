/**
 * Copy for the About page. The page layout and the "Every Seed Has" section
 * (which explains the product, not the city) live in `app/about/page.tsx`.
 */
export interface AboutTimelineStep {
  phase: string;
  when: string;
  location?: string;
  detail: string;
  /** Shown struck through with this note, e.g. "Cancelled due to weather". */
  cancelled?: string;
}

export interface AboutContent {
  metadata: { title: string; description: string };
  hero: {
    /** Small uppercase line above the title. */
    eyebrow: string;
    title: string;
    intro: string;
  };
  whatAreSeeds: string[];
  commitments: { title: string; intro: string };
  timeline: {
    title: string;
    intro: string;
    steps: AboutTimelineStep[];
  };
  howToHelp: { title: string; items: string[] };
}

export const aboutContent: AboutContent = {
  metadata: {
    title: "About",
    description:
      "Chattanooga is the 1st National Park City in America. Learn how Seeds turn community ideas into action — and how you can help.",
  },
  hero: {
    eyebrow: "1st National Park City in America",
    title: "Chattanooga National Park City",
    intro:
      "Our region — Chattanooga, Hamilton County, and the surrounding communities within roughly 50 miles of downtown — is becoming America's first National Park City. Our mission is to lead the world in improving quality of life for all of us by treating nature as our most valuable shared asset — today and for generations to come.",
  },
  whatAreSeeds: [
    "Seeds are place-based, actionable projects that require collaboration from many groups. Backyard gardens, bike corridors, housing experiments, public art, neighborhood networks — and even major civic infrastructure — can all begin as Seeds.",
    "Seeds with the most community support get planted. Once successful, they can spread to other parts of our region with the benefit of shared learnings.",
  ],
  commitments: {
    title: "Five Commitments",
    intro:
      "We use the simple, proven principles of nature to guide our culture, our connections, and our growth.",
  },
  timeline: {
    title: "How It Works",
    intro:
      "The National Park City Seed Drive: 100 Seeds from across the region.",
    steps: [
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
        detail:
          "11AM–7PM. Table-style expo, pitch practice, final collaborators",
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
        cancelled: "Cancelled due to weather",
      },
      {
        phase: "Harvest",
        when: "Late Summer / Fall",
        detail: "Celebrate and enjoy the results of our labor",
      },
    ],
  },
  howToHelp: {
    title: "How You Can Help",
    items: [
      "Bring your best ideas to the table",
      "Help spread the word in your community",
      "Join Seeds as a mentor or supporting organization",
      "Offer resources and funding for Seeds",
      "Make yourself available for a coffee conversation with Seed teams",
    ],
  },
};
