import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { GET } from "@/app/gpx/route";

type SelectedSeed = {
  name: string;
  summary: string | null;
  category: string;
  locationLat: number | null;
  locationLng: number | null;
  locationDescription: string | null;
};

function mockSeedRows(rows: SelectedSeed[]) {
  const where = vi.fn().mockResolvedValue(rows);
  const from = vi.fn().mockReturnValue({ where });
  vi.mocked(db.select).mockReturnValue({ from } as any);
  return { from, where };
}

function mockSeed(overrides: Partial<SelectedSeed> = {}): SelectedSeed {
  return {
    name: "Community Garden",
    summary: "A garden for the neighborhood.",
    category: "daily_access",
    locationLat: 35.0456,
    locationLng: -85.3097,
    locationDescription: null,
    ...overrides,
  };
}

describe("GET /gpx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets GPX content-type and download headers", async () => {
    mockSeedRows([]);

    const response = await GET();

    expect(response.headers.get("Content-Type")).toBe("application/gpx+xml");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="seeds.gpx"',
    );
  });

  it("returns an empty waypoint list with valid GPX wrapper when there is no data", async () => {
    mockSeedRows([]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain(
      '<gpx version="1.1" creator="Seeds"\n  xmlns="http://www.topografix.com/GPX/1/1">',
    );
    expect(body).toContain("<name>Seeds</name>");
    expect(body).not.toContain("<wpt");
  });

  it("generates a waypoint for each seed with a location", async () => {
    mockSeedRows([mockSeed()]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain('<wpt lat="35.0456" lon="-85.3097">');
    expect(body).toContain("<name>Community Garden</name>");
    expect(body).toContain("<desc>A garden for the neighborhood.</desc>");
    expect(body).toContain("<type>daily_access</type>");
    expect(body).not.toContain("<cmt>");
  });

  it("includes a <cmt> element only when locationDescription is present", async () => {
    mockSeedRows([mockSeed({ locationDescription: "Behind the library" })]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain("<cmt>Behind the library</cmt>");
  });

  it("omits <desc> when summary is null", async () => {
    mockSeedRows([mockSeed({ summary: null })]);

    const response = await GET();
    const body = await response.text();

    expect(body).not.toContain("<desc>");
  });

  it("filters out seeds missing a lat/lng", async () => {
    mockSeedRows([
      mockSeed({ name: "Has Location" }),
      mockSeed({ name: "No Location", locationLat: null, locationLng: null }),
    ]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain("<name>Has Location</name>");
    expect(body).not.toContain("<name>No Location</name>");
    expect(body.match(/<wpt/g)).toHaveLength(1);
  });

  it("escapes XML special characters in name, summary, description, and category", async () => {
    mockSeedRows([
      mockSeed({
        name: `Tom & Jerry's "Garden" <Test>`,
        summary: "A & B",
        locationDescription: `Near <the> "corner"`,
        category: "cat&'\"<>",
      }),
    ]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain(
      "<name>Tom &amp; Jerry&apos;s &quot;Garden&quot; &lt;Test&gt;</name>",
    );
    expect(body).toContain("<desc>A &amp; B</desc>");
    expect(body).toContain("<cmt>Near &lt;the&gt; &quot;corner&quot;</cmt>");
    expect(body).toContain("<type>cat&amp;&apos;&quot;&lt;&gt;</type>");
  });

  it("queries only non-draft, non-archived seeds", async () => {
    const { where } = mockSeedRows([]);

    await GET();

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
  });
});
