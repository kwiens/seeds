import { db } from "@/lib/db";
import { seeds } from "@/lib/db/schema";
import { and, ne } from "drizzle-orm";

export async function GET() {
  const allSeeds = await db
    .select({
      name: seeds.name,
      summary: seeds.summary,
      category: seeds.category,
      locationLat: seeds.locationLat,
      locationLng: seeds.locationLng,
      locationDescription: seeds.locationDescription,
    })
    .from(seeds)
    .where(and(ne(seeds.status, "draft"), ne(seeds.status, "archived")));

  const waypoints = allSeeds
    .filter((s) => s.locationLat != null && s.locationLng != null)
    .map(
      (s) =>
        `  <wpt lat="${s.locationLat}" lon="${s.locationLng}">
    <name>${escapeXml(s.name)}</name>${s.summary ? `\n    <desc>${escapeXml(s.summary)}</desc>` : ""}${s.locationDescription ? `\n    <cmt>${escapeXml(s.locationDescription)}</cmt>` : ""}
    <type>${escapeXml(s.category)}</type>
  </wpt>`,
    )
    .join("\n");

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Seeds"
  xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Seeds</name>
  </metadata>
${waypoints}
</gpx>`;

  return new Response(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": 'attachment; filename="seeds.gpx"',
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
