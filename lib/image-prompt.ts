const CATEGORY_LABELS: Record<string, string> = {
  daily_access: "Daily Access",
  outdoor_play: "Outdoor Play",
  balanced_growth: "Balanced Growth",
  respect: "Respect",
  connected_communities: "Connected Communities",
};

export function buildImagePrompt(seed: {
  name: string;
  summary: string;
  category: string;
  locationAddress: string | null;
  waterHave: string[];
}) {
  const categoryLabel = CATEGORY_LABELS[seed.category] ?? seed.category;
  const summarySnippet = seed.summary.slice(0, 500);

  const details: string[] = [];
  if (seed.locationAddress) {
    details.push(`Location: ${seed.locationAddress}.`);
  }
  if (seed.waterHave.length > 0) {
    details.push(`Resources available: ${seed.waterHave.join(", ")}.`);
  }

  return `Create a charming illustration for a community project in Chattanooga, Tennessee — a National Park City surrounded by mountains, rivers, and forests. The project is called "${seed.name}" in the "${categoryLabel}" category. Description: "${summarySnippet}". ${details.join(" ")} The setting is Southeast Tennessee — draw from the region's native wildlife and flora: box turtles, white-tailed deer, red-tailed hawks, eastern bluebirds, tulip poplars, dogwoods, rhododendrons, and mountain laurel. People here enjoy mountain biking, hiking, rock climbing, kayaking, paddleboarding, trail running, fishing, and community gardening. Weave relevant activities and local nature into the scene. Style: warm, inviting watercolor illustration with soft greens, earth tones, and golden light. The edges of the illustration should fade into pure white with an organic, irregular shape — as if the watercolor painting was done on torn paper placed on a white background. The white is not a frame or border; it is negative space where the painting simply ends, with rough, natural edges where paint meets white. Some elements like leaves or branches can extend into the white area. The mood should be hopeful and community-oriented. No text or words in the image.`;
}
