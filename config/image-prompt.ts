/**
 * The place-specific half of the AI poster prompt.
 *
 * `lib/image-prompt.ts` combines this with the project's own details and the
 * poster style, which stays the same for every city. Describe your city the
 * way you would brief an illustrator who has never been there.
 */
export interface ImagePromptConfig {
  /** Completes "a community project in ...". */
  subject: string;
  /** Printed under the project title on every poster. */
  subtitle: string;
  /** Each entry becomes its own paragraph, in order. */
  place: {
    geography: string;
    wildlifeAndFlora: string;
    activities: string;
    cityLife: string;
    landscape: string;
  };
}

export const imagePromptConfig: ImagePromptConfig = {
  subject:
    "Chattanooga, Tennessee, a National Park City surrounded by mountains, rivers, and forests",
  subtitle: "National Park City",
  place: {
    geography:
      "Area Geography: Chattanooga is defined by a dramatic transition from flat river basins to towering plateaus. It features sheer granite and sandstone cliff faces (famous for rock climbing) and hidden subterranean wonders like Ruby Falls. Just west of the Great Smoky Mountains, sharing that iconic blue-mist horizon.",
    wildlifeAndFlora:
      "Native wildlife and flora: box turtles, white-tailed deer, red-tailed hawks, eastern bluebirds, tulip poplars, dogwoods, rhododendrons, and mountain laurel.",
    activities:
      "Activities: Pick activities relevant to the project. People here enjoy mountain biking, hiking, rock climbing, kayaking, paddleboarding, trail running, fishing, rollerblading, white water rafting, and community gardening. Weave relevant activities and local nature into the scene.",
    cityLife:
      "City life: Chattanooga's urban core is compact, walkable, and layered — historic brick warehouses, Art Deco civic buildings, modern glass infill, pedestrian bridges, riverfront paths, and steep green bluffs all within a small footprint.",
    landscape:
      "Flora & Water: The landscape is carpeted in dense deciduous forests of oak, hickory, and tulip poplars. No pine trees. Hidden in the folds of the rolling hills are moss-covered rolling brooks, limestone swimming holes, and tiered waterfalls that spill over rocky ledges.",
  },
};
