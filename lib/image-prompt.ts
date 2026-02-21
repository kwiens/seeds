/**
 * Shorten a project title to 2-4 words for poster typography.
 * Strips trailing location phrases and takes the core noun phrase.
 */
export function shortenTitle(name: string): string {
  const short = name
    .replace(/\s+(?:near|at|on|beside|along)\s+.+$/i, "")
    .replace(/\s+from\s+.+$/i, "");
  const words = short.split(/\s+/);
  if (words.length <= 4) return short;
  return words.slice(-3).join(" ");
}

export function buildImagePrompt(seed: {
  name: string;
  summary: string;
  locationAddress: string | null;
  waterHave: string[];
}) {
  const summarySnippet = seed.summary.slice(0, 500);
  const posterTitle = shortenTitle(seed.name);

  const details: string[] = [];
  if (seed.locationAddress) {
    details.push(`Location: ${seed.locationAddress}.`);
  }
  if (seed.waterHave.length > 0) {
    details.push(`Resources available: ${seed.waterHave.join(", ")}.`);
  }

  return `Create a vintage WPA-era national park poster illustration of a community project in Chattanooga, Tennessee, a National Park City surrounded by mountains, rivers, and forests.

Composition: Vertical 4:5 poster layout. Bold foreground focal element representing the project. Use either a natural landscape or urban environment, depending on the subject.

Title: ${posterTitle}
Subtitle: National Park City

Typography: National park sans-serif, bold font. Sans serifs feel the pull of the Machine Age. Rough, worn, and perfectly imperfect. The individual letterforms do not strictly abide by all typographic rules, but this intentional imperfection adds to its charm. This typeface feels as if it was drawn by hand, just like the hand lettering in the vintage National Park posters. Just the title and subtitle, NO OTHER TEXT in the graphic.

Focus the composition on the project. "${summarySnippet}". ${details.join(" ")}

Style: WPA-era screenprinted travel poster. Bold graphic composition, simplified shapes, warm earthy color palette, dramatic light and shadow, mid-century screen print texture, minimal detail but strong silhouettes, layered depth, optimistic and heroic tone, clean vector illustration, retro travel poster design, subtle paper grain texture.

Area Geography: Chattanooga is defined by a dramatic transition from flat river basins to towering plateaus. It features sheer granite and sandstone cliff faces (famous for rock climbing) and hidden subterranean wonders like Ruby Falls. Just west of the Great Smoky Mountains, sharing that iconic blue-mist horizon.

Native wildlife and flora: box turtles, white-tailed deer, red-tailed hawks, eastern bluebirds, tulip poplars, dogwoods, rhododendrons, and mountain laurel.

Activities: Pick activities relevant to the project. People here enjoy mountain biking, hiking, rock climbing, kayaking, paddleboarding, trail running, fishing, rollerblading, white water rafting, and community gardening. Weave relevant activities and local nature into the scene.

City life: Chattanooga's urban core is compact, walkable, and layered — historic brick warehouses, Art Deco civic buildings, modern glass infill, pedestrian bridges, riverfront paths, and steep green bluffs all within a small footprint.

Flora & Water: The landscape is carpeted in dense deciduous forests of oak, hickory, and tulip poplars. No pine trees. Hidden in the folds of the rolling hills are moss-covered rolling brooks, limestone swimming holes, and tiered waterfalls that spill over rocky ledges.

Typography: National park sans-serif, bold font. Sans serifs feel the pull of the Machine Age. Rough, worn, and perfectly imperfect. The individual letterforms do not strictly abide by all typographic rules, but this intentional imperfection adds to its charm. This typeface feels as if it was drawn by hand, just like the hand lettering in the vintage National Park posters. Just the title and subtitle, no other text in the graphic.`;
}
