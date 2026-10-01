// One-time seed of the real Harvest Fest 2026 copy into site_settings, for
// local verification. Production content goes in through the live /admin
// Harvest Fest editor instead — that's the whole point of this feature.
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ path: ".env.development.local", override: true, quiet: true });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { assertSafeDatabaseUrl } from "../lib/db/safety";
import * as schema from "../lib/db/schema";
import type { HarvestFestPage } from "../lib/db/queries/settings";

const databaseUrl = assertSafeDatabaseUrl(process.env.DATABASE_URL);
const client = neon(databaseUrl);
const db = drizzle(client, { schema });

const page: HarvestFestPage = {
  title: "National Park City Harvest Fest",
  tagline: "See what grew.",
  intro:
    "This spring, we planted seeds across our city. This fall, Harvest Fest is a chance to come together and experience what's growing.",
  events: [
    {
      date: "September 26",
      time: "9 AM–3 PM",
      title: "The Play Street",
      location: "Chestnut Street between 3rd & 4th",
      description:
        "The Creative Discovery museum is transforming a city street into a place to play, gather and imagine what our streets can be.",
    },
    {
      date: "October 3",
      time: "12–2 PM",
      title: "Maclellan Island Eco Tours",
      location: "",
      description:
        "Come see the goats and explore one of Chattanooga's wild places in the heart of downtown on the Tennessee River.",
    },
    {
      date: "October 11",
      time: "4–6 PM",
      title: "Farm Park",
      location: "",
      description:
        "Come for BYO Pumpkin Carving and see a new vision for bringing farming, food, nature and community together.",
    },
    {
      date: "October 17",
      time: "2 PM",
      title: "Library in a Park",
      location: "Downtown Library",
      description:
        "Celebrate the library's 50th anniversary and the new outdoor pocket park at the library.",
    },
    {
      date: "October 24",
      time: "12–5 PM",
      title: "Litter Bit Louder Tour",
      location: "Kitchen Incubator: 5704 Marlin Rd",
      description:
        "Come clean up litter and sing karaoke after with food trucks and fun for the whole fam.",
    },
    {
      date: "November 6",
      time: "6–9 PM",
      title: "Lights Out: Stargazing Party",
      location: "Greenway Farm",
      description:
        "Come see the stars and discover why protecting our night sky matters.",
    },
    {
      date: "November 7",
      time: "10 AM–12 PM",
      title: "Old Bird Mill Sanctuary",
      location: "",
      description:
        "See how a former industrial site is becoming an urban sanctuary for wildlife and people.",
    },
  ],
};

async function main() {
  await db
    .insert(schema.siteSettings)
    .values({
      key: "harvest_fest_page",
      value: JSON.stringify(page),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value: sql`excluded.value`, updatedAt: sql`excluded.updated_at` },
    });
  console.log(`Seeded Harvest Fest page with ${page.events.length} events.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
