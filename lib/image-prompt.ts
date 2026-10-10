import { imagePromptConfig } from "@/config/image-prompt";

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

const TYPOGRAPHY =
  "Typography: National park sans-serif, bold font. Sans serifs feel the pull of the Machine Age. Rough, worn, and perfectly imperfect. The individual letterforms do not strictly abide by all typographic rules, but this intentional imperfection adds to its charm. This typeface feels as if it was drawn by hand, just like the hand lettering in the vintage National Park posters. Just the title and subtitle, NO OTHER TEXT in the graphic.";

const STYLE =
  "Style: WPA-era screenprinted travel poster. Bold graphic composition, simplified shapes, warm earthy color palette, dramatic light and shadow, mid-century screen print texture, minimal detail but strong silhouettes, layered depth, optimistic and heroic tone, clean vector illustration, retro travel poster design, subtle paper grain texture.";

/**
 * The poster style is shared by every city; the place description comes from
 * `config/image-prompt.ts`.
 */
export function buildImagePrompt(project: {
  name: string;
  summary: string;
  locationAddress: string | null;
  waterHave: string[];
}) {
  const summarySnippet = project.summary.slice(0, 500);
  const posterTitle = shortenTitle(project.name);

  const details: string[] = [];
  if (project.locationAddress) {
    details.push(`Location: ${project.locationAddress}.`);
  }
  if (project.waterHave.length > 0) {
    details.push(`Resources available: ${project.waterHave.join(", ")}.`);
  }

  const { subject, subtitle, place } = imagePromptConfig;

  return [
    `Create a vintage WPA-era national park poster illustration of a community project in ${subject}.`,
    "Composition: Vertical 4:5 poster layout. Bold foreground focal element representing the project. Use either a natural landscape or urban environment, depending on the subject.",
    `Title: ${posterTitle}\nSubtitle: ${subtitle}`,
    TYPOGRAPHY,
    `Focus the composition on the project. "${summarySnippet}". ${details.join(" ")}`.trimEnd(),
    STYLE,
    place.geography,
    place.wildlifeAndFlora,
    place.activities,
    place.cityLife,
    place.landscape,
  ].join("\n\n");
}
