import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull, like } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import * as schema from "../lib/db/schema";
import { buildImagePrompt } from "../lib/image-prompt";

const SEED_BOT_EMAIL = "seedbot@seeds.example.com";
const SEED_BOT_NAME = "Seed Bot";

// ---------------------------------------------------------------------------
// Fictional community member names
// ---------------------------------------------------------------------------
const PEOPLE = [
  "Maria Gonzalez",
  "DeShawn Mitchell",
  "Sarah Chen",
  "James Whitfield",
  "Priya Patel",
  "Marcus Jones",
  "Emily Thornton",
  "Carlos Rivera",
  "Aisha Williams",
  "David Kim",
  "Rachel Foster",
  "Terrence Brooks",
  "Hannah Okafor",
  "Jake Patterson",
  "Nadia Alvarez",
  "Brian Sullivan",
  "Fatima Hassan",
  "Tyler Reed",
  "Lena Petrova",
  "Omar Washington",
  "Grace Nakamura",
  "Dante Lewis",
  "Sofia Ruiz",
  "Eli Cooper",
  "Jasmine Tran",
  "Kevin O'Brien",
  "Amara Diop",
  "Ryan Sato",
  "Lily Cheng",
  "Andre Clark",
];

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------
async function generateImage(seed: {
  id: string;
  name: string;
  summary: string;
  category: string;
  locationAddress: string | null;
  waterHave: string[];
}) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return { error: "GOOGLE_GENERATIVE_AI_API_KEY is not set." };
  }

  const prompt = buildImagePrompt(seed);

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "3:4",
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    return { error: "No image was generated." };
  }

  const imagePart = parts.find((part) =>
    part.inlineData?.mimeType?.startsWith("image/"),
  );
  if (!imagePart?.inlineData?.data) {
    return { error: "No image data in response." };
  }

  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  const mimeType = imagePart.inlineData.mimeType ?? "image/png";
  const extension = mimeType === "image/jpeg" ? "jpg" : "png";

  const blob = await put(`seeds/${seed.id}.${extension}`, imageBuffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: true,
  });

  return { imageUrl: blob.url };
}

// Helpers
function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Seed data — 50 projects, 10 per category
// ---------------------------------------------------------------------------
type Category = (typeof schema.categoryEnum.enumValues)[number];

interface SeedData {
  name: string;
  summary: string;
  category: Category;
  lat: number;
  lng: number;
  address: string;
  gardeners: string[];
  roots: string[];
  waterHave: string[];
  waterNeed: string[];
}

const SEEDS: SeedData[] = [
  // =========================================================================
  // DAILY ACCESS (10)
  // =========================================================================
  {
    name: "East Lake Elementary to South Chick Greenway Stripe Route",
    summary:
      "A painted walking and biking route connecting East Lake Elementary School to the South Chickamauga Greenway, giving students and families a safe, visible path to one of Chattanooga's best trail networks. The stripe route would use bright paint markings on sidewalks and roadways to create a continuous visual guide from the school entrance to the nearest greenway access point.\n\nThis project addresses a key gap: many East Lake families live within a mile of the greenway but lack a clearly marked, comfortable route to reach it. By partnering with Hamilton County Schools and Outdoor Chattanooga, the stripe route would become a signature walking-school-bus corridor used daily by dozens of students.",
    category: "daily_access",
    lat: 35.0248,
    lng: -85.2648,
    address: "East Lake Elementary, Chattanooga, TN",
    gardeners: ["Maria Gonzalez", "DeShawn Mitchell", "Sarah Chen"],
    roots: ["Hamilton County Schools", "Outdoor Chattanooga"],
    waterHave: [
      "Existing sidewalks along most of the route",
      "School walking-bus volunteer program",
      "Greenway access point within 0.8 miles",
    ],
    waterNeed: [
      "Thermoplastic paint and installation crew",
      "Wayfinding sign design and fabrication",
      "City permit for roadway markings",
    ],
  },
  {
    name: "Normal Park to Tennessee Riverwalk Fitness Loop",
    summary:
      "A one-mile student fitness loop connecting Normal Park Museum Magnet School to the Tennessee Riverwalk, designed as a daily exercise route for PE classes, after-school running clubs, and neighborhood walkers. The loop would follow existing sidewalks with added distance markers, stretch stations, and rest benches at quarter-mile intervals.\n\nNormal Park sits just minutes from the Riverwalk, but the connection feels invisible — there are no signs, no markers, and no invitation to make the trip. This project would change that by creating an obvious, welcoming loop that teachers can incorporate into curriculum and families can use on weekends.",
    category: "daily_access",
    lat: 35.033,
    lng: -85.292,
    address: "Normal Park, Chattanooga, TN",
    gardeners: ["James Whitfield", "Priya Patel"],
    roots: [
      "Hamilton County Schools",
      "Tennessee Riverpark Conservancy",
      "Outdoor Chattanooga",
    ],
    waterHave: [
      "Continuous sidewalk to Riverwalk",
      "PE teacher support for outdoor curriculum",
    ],
    waterNeed: [
      "Distance marker posts (8 total)",
      "Two stretch-station installations",
      "Benches at quarter-mile intervals",
      "Funding for signage design",
    ],
  },
  {
    name: "Stringer's Ridge Gravel Trail Entrance from Spears Avenue",
    summary:
      "A new gravel trail entrance into Stringer's Ridge Nature Preserve from Spears Avenue on the south side, providing direct access for North Shore residents who currently must drive or walk a long detour to reach existing trailheads. The entrance would include a simple gravel path, a trail map kiosk, and a small bike rack.\n\nStringer's Ridge is one of Chattanooga's most beloved urban green spaces, but access points are limited. Residents on Spears Avenue and nearby streets can see the ridge from their porches but face a half-mile walk to the nearest trailhead. This new entrance would serve hundreds of households and reduce trailhead parking congestion.",
    category: "daily_access",
    lat: 35.0665,
    lng: -85.3165,
    address: "Spears Avenue, Chattanooga, TN",
    gardeners: ["Marcus Jones", "Emily Thornton", "Carlos Rivera"],
    roots: ["Scenic City Trail Runners", "Outdoor Chattanooga"],
    waterHave: [
      "City-owned right-of-way at proposed entrance",
      "Existing informal social trail",
      "Volunteer trail crew available",
    ],
    waterNeed: [
      "Gravel and compaction equipment",
      "Trail map kiosk fabrication",
      "Bike rack installation",
      "Erosion control measures",
    ],
  },
  {
    name: "Ross's Landing Riverwalk Trailhead Amenities",
    summary:
      "Install a bench, bike rack, and water bottle refill station at the Riverwalk trailhead near Ross's Landing, creating a welcoming starting point for one of Chattanooga's most popular trails. Currently the trailhead has minimal amenities — visitors often start their walk or ride without a place to sit, lock a bike, or fill a water bottle.\n\nRoss's Landing sees thousands of visitors weekly between the aquarium, the Riverwalk, and the Walnut Street Bridge. Adding these basic amenities would make the trailhead functional for commuters, tourists, and families alike, and signal that the Riverwalk is a first-class public space.",
    category: "daily_access",
    lat: 35.0557,
    lng: -85.3097,
    address: "Ross's Landing, Chattanooga, TN",
    gardeners: ["Aisha Williams", "David Kim"],
    roots: ["River City Company", "Tennessee Riverpark Conservancy"],
    waterHave: [
      "Existing paved trailhead area",
      "Nearby water utility connection",
      "High foot traffic ensuring use",
    ],
    waterNeed: [
      "Bench and bike rack hardware",
      "Water bottle refill station",
      "Installation labor",
    ],
  },
  {
    name: "High-Visibility Crosswalks on Dodds Avenue at South Chick Greenway",
    summary:
      "Paint high-visibility continental crosswalks at the three Dodds Avenue intersections where the South Chickamauga Greenway crosses or parallels the road. Currently these crossings have faded paint and no pedestrian signals, creating a dangerous gap in an otherwise excellent greenway.\n\nDodds Avenue carries significant traffic, and greenway users — including children biking to school — must cross without clear markings. High-visibility crosswalks are a proven, low-cost safety intervention that would immediately improve comfort for hundreds of daily greenway users.",
    category: "daily_access",
    lat: 35.022,
    lng: -85.283,
    address: "Dodds Avenue at South Chick Greenway, Chattanooga, TN",
    gardeners: ["Rachel Foster", "Terrence Brooks"],
    roots: ["Bike Chattanooga", "CARTA", "Outdoor Chattanooga"],
    waterHave: [
      "Existing crosswalk locations (need repainting)",
      "City traffic study supporting improvements",
    ],
    waterNeed: [
      "Thermoplastic crosswalk materials",
      "Pedestrian signal at main crossing",
      "City road crew scheduling",
      "Reflective bollards for approach",
    ],
  },
  {
    name: "Solar Path Lights on South Chick Greenway near Avondale",
    summary:
      "Install solar-powered LED path lights along a half-mile stretch of the South Chickamauga Greenway near the Avondale neighborhood, extending usable hours for commuters and evening walkers. This section of the greenway becomes very dark after sunset, effectively closing it to anyone who isn't comfortable walking in the dark.\n\nSolar path lights require no trenching or electrical hookup, making them a fast, low-impact improvement. The Avondale section is particularly important because many residents use the greenway to reach bus stops and neighborhood businesses. Lighting it would make the greenway a true transportation corridor, not just a daytime recreation path.",
    category: "daily_access",
    lat: 35.015,
    lng: -85.275,
    address: "South Chick Greenway near Avondale, Chattanooga, TN",
    gardeners: ["Hannah Okafor", "Jake Patterson", "Nadia Alvarez"],
    roots: ["Green|Spaces", "Outdoor Chattanooga"],
    waterHave: [
      "Existing paved greenway surface",
      "Community support from Avondale neighborhood association",
      "Solar feasibility confirmed (no canopy overhead)",
    ],
    waterNeed: [
      "20 solar LED path light units",
      "Concrete footings for light posts",
      "Installation volunteer crew",
    ],
  },
  {
    name: "Wilcox Boulevard Sidewalk Gap Fill",
    summary:
      "Fill the missing sidewalk segment on Wilcox Boulevard between Glass Street and the South Chickamauga Greenway, closing a critical gap that forces pedestrians to walk in the road shoulder. This 0.3-mile stretch is the last missing link between a dense residential area and the greenway system.\n\nResidents of the Glass Street corridor have long identified this gap as a barrier to using the greenway. Without a sidewalk, parents won't let children walk or bike to the trail. Completing this segment would connect hundreds of households to miles of car-free greenway.",
    category: "daily_access",
    lat: 35.026,
    lng: -85.279,
    address: "Wilcox Blvd near Glass Street, Chattanooga, TN",
    gardeners: ["Brian Sullivan", "Fatima Hassan"],
    roots: ["Glass House Collective", "CARTA"],
    waterHave: [
      "City sidewalk capital improvement plan includes this segment",
      "Right-of-way already acquired",
    ],
    waterNeed: [
      "Concrete sidewalk construction ($85K estimated)",
      "ADA-compliant curb ramps",
      "Stormwater drainage adjustments",
      "Construction traffic management",
    ],
  },
  {
    name: "Floating Dock at South Chick Creek near Camp Jordan",
    summary:
      "Install a small floating dock on South Chickamauga Creek near the Camp Jordan greenway entrance, providing kayak and canoe access to a beautiful but currently inaccessible waterway. The creek at this point is wide and calm enough for paddling, but there's no safe launch point.\n\nA floating dock would open up a new recreation opportunity for East Hamilton County residents and connect the greenway to the water. Paddlers could launch here and float downstream through scenic wetlands, experiencing the creek ecosystem that the greenway parallels on land.",
    category: "daily_access",
    lat: 35.044,
    lng: -85.207,
    address: "South Chick Creek near Camp Jordan, Chattanooga, TN",
    gardeners: ["Tyler Reed", "Lena Petrova", "Omar Washington"],
    roots: ["Outdoor Chattanooga", "Tennessee Wildlife Resources Agency"],
    waterHave: [
      "Adequate creek depth and flow for paddling",
      "Adjacent greenway parking lot",
      "Willing landowner (Hamilton County Parks)",
    ],
    waterNeed: [
      "Floating dock system and anchoring",
      "Permit from TDEC for waterway access",
      "Kayak launch ramp",
      "Safety signage and life jacket station",
    ],
  },
  {
    name: "Downtown Library to Riverwalk Wayfinding Signs",
    summary:
      "Install a series of wayfinding signs guiding pedestrians from the Chattanooga Public Library downtown to the Tennessee Riverwalk, a walk of less than 10 minutes that most library visitors don't know about. The signs would use the city's existing wayfinding design language and include walking time estimates.\n\nThe downtown library is one of the city's most visited public buildings, and the Riverwalk is one of its best public spaces — but they feel disconnected. Simple directional signs at key decision points would help thousands of library visitors discover the trail, especially families and tourists who don't know the area.",
    category: "daily_access",
    lat: 35.049,
    lng: -85.307,
    address: "Chattanooga Public Library, Chattanooga, TN",
    gardeners: ["Grace Nakamura", "Dante Lewis"],
    roots: ["River City Company", "Chattanooga Design Studio"],
    waterHave: [
      "Existing city wayfinding design standards",
      "Library partnership confirmed",
      "Clear pedestrian route already exists",
    ],
    waterNeed: [
      "6 wayfinding sign panels",
      "Post and mounting hardware",
      "Design adaptation for library branding",
    ],
  },
  {
    name: "Riverwalk Quarter-Mile Distance Markers",
    summary:
      "Install quarter-mile distance markers along the Tennessee Riverwalk from the Walnut Street Bridge to Bluff View Art District, helping runners, walkers, and physical therapy patients track their distances on this popular stretch. The markers would be simple, durable posts with distance noted in both directions.\n\nThis section of the Riverwalk is heavily used by fitness walkers and runners who currently rely on phone GPS or guesswork to track distance. Physical therapists at nearby Erlanger hospital regularly prescribe walking distances for patients recovering from surgery — clear markers would make the Riverwalk a rehabilitation resource.",
    category: "daily_access",
    lat: 35.059,
    lng: -85.308,
    address: "Walnut Street Bridge, Chattanooga, TN",
    gardeners: ["Sofia Ruiz", "Eli Cooper"],
    roots: ["Tennessee Riverpark Conservancy", "Outdoor Chattanooga"],
    waterHave: [
      "Existing paved riverwalk surface",
      "High daily foot traffic",
      "Partnership with local running clubs",
    ],
    waterNeed: [
      "Distance marker posts (8 total)",
      "Survey and measurement of route",
      "Installation permits from Riverpark",
    ],
  },

  // =========================================================================
  // OUTDOOR PLAY (10)
  // =========================================================================
  {
    name: "South Chick Greenway Dirt Pump Track",
    summary:
      "Build a dirt pump track beside the South Chickamauga Greenway near Sterchi Farm, giving kids and adults a free, drop-in cycling and scooter course right on the trail network. Pump tracks are rolling circuits of bumps and berms that riders navigate without pedaling, building bike handling skills and confidence.\n\nChattanooga has no public pump track despite a thriving cycling culture. Placing one on the greenway means families can ride to it, use it, and continue their greenway trip — no car required. The dirt construction keeps costs low and allows community build days that create ownership.",
    category: "outdoor_play",
    lat: 35.035,
    lng: -85.26,
    address: "South Chick Greenway near Sterchi Farm, Chattanooga, TN",
    gardeners: ["Marcus Jones", "Jake Patterson", "Aisha Williams"],
    roots: ["Bike Chattanooga", "Outdoor Chattanooga"],
    waterHave: [
      "Open flat area adjacent to greenway",
      "Volunteer bike community ready to build",
      "Pump track design template from IMBA",
    ],
    waterNeed: [
      "Dirt and clay materials (40 cubic yards)",
      "Excavator rental for shaping",
      "Drainage layer installation",
      "Safety signage",
    ],
  },
  {
    name: "Warner Park Pop-Up Traffic Garden",
    summary:
      "Create a pop-up traffic garden in the Warner Park parking lot on weekends, teaching children bike safety through a miniature streetscape with painted roads, stop signs, crosswalks, and traffic signals. Kids ride their bikes through the course, learning rules of the road in a safe, car-free environment.\n\nTraffic gardens are proven tools for building children's confidence and safety awareness on bikes. Warner Park's large parking lot is underused on weekends and perfectly flat for painting. The pop-up format means the garden can be deployed seasonally without permanent changes to the lot.",
    category: "outdoor_play",
    lat: 35.058,
    lng: -85.283,
    address: "Warner Park, Chattanooga, TN",
    gardeners: ["Emily Thornton", "Carlos Rivera"],
    roots: ["Bike Chattanooga", "Hamilton County Schools"],
    waterHave: [
      "Warner Park parking lot available weekends",
      "Existing bike safety curriculum from Bike Chattanooga",
      "Portable traffic signs and cones in storage",
    ],
    waterNeed: [
      "Temporary road paint for lot markings",
      "Miniature traffic signals (battery-powered)",
      "Loaner bikes and helmets for kids without them",
      "Weekend volunteer coordinators",
    ],
  },
  {
    name: "Renaissance Park Nature Play Features",
    summary:
      "Install nature play features at Renaissance Park — log balance beams, boulder scrambles, willow tunnels, and a sand dig area — creating a free-range play zone that complements the park's existing open space. Nature play encourages unstructured outdoor exploration and builds physical confidence in children.\n\nRenaissance Park has beautiful open fields and river views but limited play infrastructure beyond a basic playground. Nature play features are low-maintenance, blend with the landscape, and appeal to a wide age range from toddlers to preteens. They also align with the park's ecological character near the river.",
    category: "outdoor_play",
    lat: 35.064,
    lng: -85.32,
    address: "Renaissance Park, Chattanooga, TN",
    gardeners: ["Priya Patel", "DeShawn Mitchell", "Hannah Okafor"],
    roots: ["Chattanooga Parks & Outdoors", "Trust for Public Land"],
    waterHave: [
      "Open parkland with natural materials nearby",
      "Park department maintenance agreement",
      "Community design input from two public meetings",
    ],
    waterNeed: [
      "Sourced logs for balance beams and steppers",
      "Boulder delivery and placement",
      "Willow whip planting for tunnels",
      "Sand delivery and containment border",
    ],
  },
  {
    name: "Stringer's Ridge Beginner MTB Skill Features",
    summary:
      "Install beginner mountain bike skill features at the Cherokee Trailhead on Stringer's Ridge — a small skills loop with log rides, rock gardens, and skinny bridges at ground level. These features would give new mountain bikers a place to practice before tackling the ridge's intermediate trails.\n\nStringer's Ridge trails are popular but can be intimidating for beginners. A skills area at the trailhead would lower the barrier to entry, especially for kids and adults new to off-road cycling. The features use natural materials that match the preserve's aesthetic and require minimal maintenance.",
    category: "outdoor_play",
    lat: 35.068,
    lng: -85.312,
    address: "Cherokee Trailhead, Stringer's Ridge, Chattanooga, TN",
    gardeners: ["Tyler Reed", "Marcus Jones"],
    roots: ["Scenic City Trail Runners", "Bike Chattanooga"],
    waterHave: [
      "Cleared area at trailhead",
      "SORBA chapter volunteer builders",
      "Donated lumber from local mill",
    ],
    waterNeed: [
      "Rock garden stone sourcing",
      "Skinny bridge construction materials",
      "Trail surface gravel",
      "Feature design consultation",
    ],
  },
  {
    name: "Coolidge Park Climbable Boulders on Riverwalk",
    summary:
      "Place a cluster of climbable boulders along the Riverwalk near Coolidge Park, creating a natural play feature for children and a gathering spot for families. The boulders would be sourced locally, sized for safe climbing (3-5 feet tall), and set in a rubber mulch safety surface.\n\nCoolidge Park draws huge crowds but the Riverwalk section passing through it has few reasons to stop and play. Climbable boulders would create a magnet for kids, give parents a reason to linger, and add visual interest to the trail corridor. The natural stone aesthetic complements the river setting.",
    category: "outdoor_play",
    lat: 35.0615,
    lng: -85.3095,
    address: "Coolidge Park, Chattanooga, TN",
    gardeners: ["Sarah Chen", "Eli Cooper", "Nadia Alvarez"],
    roots: ["River City Company", "Chattanooga Parks & Outdoors"],
    waterHave: [
      "Flat area adjacent to Riverwalk path",
      "Local quarry willing to donate boulders",
      "Park department site approval",
    ],
    waterNeed: [
      "Boulder transport and crane placement",
      "Rubber mulch safety surface",
      "Landscape border installation",
    ],
  },
  {
    name: "Chickamauga Dam Fishing Platform Repair",
    summary:
      "Repair the deteriorating fishing platform at Chickamauga Dam Day Use Area, restoring safe access for one of Chattanooga's most popular fishing spots. The existing platform has broken railings, rotting deck boards, and ADA-accessibility issues that limit use.\n\nHundreds of anglers use this platform weekly, including many elderly residents and families with children. The current condition is a liability and discourages use by anyone who isn't confident navigating damaged infrastructure. A full repair would restore this community asset and ensure it's accessible to all.",
    category: "outdoor_play",
    lat: 35.075,
    lng: -85.228,
    address: "Chickamauga Dam Day Use Area, Chattanooga, TN",
    gardeners: ["Brian Sullivan", "Andre Clark"],
    roots: ["Tennessee Wildlife Resources Agency", "Outdoor Chattanooga"],
    waterHave: [
      "Existing platform substructure is sound",
      "TWRA maintenance budget covers materials",
      "Volunteer labor from local fishing clubs",
    ],
    waterNeed: [
      "Composite decking boards (200 sq ft)",
      "Galvanized railing replacements",
      "ADA-compliant ramp section",
      "Structural engineering review",
    ],
  },
  {
    name: "South Chick Greenway Wetland Boardwalk Spur",
    summary:
      "Build a short boardwalk spur off the South Chickamauga Greenway near 17th Street into the adjacent wetlands, creating an immersive nature observation point. The boardwalk would extend about 200 feet into the wetland with an observation platform at the end overlooking the marsh habitat.\n\nThe wetlands along South Chick Creek are ecologically rich but invisible from the greenway. A boardwalk spur would let trail users experience this hidden ecosystem — herons, turtles, dragonflies — without disturbing the habitat. It would serve as an outdoor classroom for nearby schools and a unique attraction on the greenway.",
    category: "outdoor_play",
    lat: 35.02,
    lng: -85.27,
    address: "South Chick Greenway near 17th Street, Chattanooga, TN",
    gardeners: ["Lena Petrova", "Rachel Foster", "Omar Washington"],
    roots: [
      "Tennessee Wildlife Resources Agency",
      "Chattanooga Audubon Society",
    ],
    waterHave: [
      "Identified wetland access point with firm ground",
      "Environmental assessment completed",
      "Audubon volunteer docent program",
    ],
    waterNeed: [
      "Pressure-treated boardwalk lumber",
      "Helical pile foundation system",
      "Observation platform railing and benches",
      "Interpretive signage about wetland ecology",
    ],
  },
  {
    name: "North Chick Greenway Weekly Outdoor Classroom",
    summary:
      "Establish a weekly outdoor classroom program on the North Chickamauga Greenway near Greenway Farms, where elementary students spend a half-day each week learning science, art, and writing in natural settings along the trail. The program would include a sheltered outdoor teaching area with log seating and a whiteboard.\n\nOutdoor classrooms improve focus, reduce stress, and build environmental literacy. The North Chick Greenway near Greenway Farms offers diverse habitats — creek, forest, meadow — within walking distance, making it an ideal living laboratory. The program would start with one partner school and expand based on demand.",
    category: "outdoor_play",
    lat: 35.085,
    lng: -85.235,
    address: "North Chick Greenway near Greenway Farms, Chattanooga, TN",
    gardeners: ["Grace Nakamura", "James Whitfield"],
    roots: ["Hamilton County Schools", "Crabtree Farms"],
    waterHave: [
      "Greenway Farms willing to host program",
      "Two teachers trained in outdoor education",
      "Grant application submitted to Benwood Foundation",
    ],
    waterNeed: [
      "Sheltered teaching area construction",
      "Log seating circle installation",
      "Outdoor whiteboard and supply storage",
      "Bus transportation funding for partner school",
    ],
  },
  {
    name: "Riverwalk Interactive Art Sculptures near Hunter Museum",
    summary:
      "Commission and install three interactive art sculptures along the Riverwalk near the Hunter Museum of American Art, creating playful landmarks that invite physical engagement — spinning, climbing, and balancing. The sculptures would be designed by regional artists and fabricated from weatherproof materials.\n\nThe Riverwalk below the Hunter Museum is a stunning stretch of trail with dramatic bluff views, but there's little to interact with between the museum and Bluff View. Interactive sculptures would give this section a distinct identity, encourage lingering, and extend the museum's artistic presence into the public landscape.",
    category: "outdoor_play",
    lat: 35.057,
    lng: -85.3065,
    address: "Riverwalk near Hunter Museum, Chattanooga, TN",
    gardeners: ["Jasmine Tran", "David Kim", "Sofia Ruiz"],
    roots: ["River City Company", "Chattanooga Design Studio"],
    waterHave: [
      "Hunter Museum partnership and curatorial guidance",
      "Riverwalk easement for installations",
      "Regional artist shortlist compiled",
    ],
    waterNeed: [
      "Artist commission funding ($45K for three pieces)",
      "Concrete foundations for sculptures",
      "Fabrication and installation",
      "Lighting for evening visibility",
    ],
  },
  {
    name: "Camp Jordan Greenway Seasonal Splash Pad",
    summary:
      "Install a seasonal splash pad at the Camp Jordan Greenway entrance, providing free water play for families during Chattanooga's hot summers. The splash pad would use recirculating water with ground-level jets and spray features, activated by push buttons to conserve water.\n\nCamp Jordan is a major recreational hub but has no water play feature. Families visiting the greenway in summer — especially those biking or walking — need a way to cool down. A splash pad at the entrance would make Camp Jordan a destination for young families and complement the existing playground and sports fields.",
    category: "outdoor_play",
    lat: 35.042,
    lng: -85.205,
    address: "Camp Jordan Greenway entrance, East Ridge, TN",
    gardeners: ["Fatima Hassan", "Kevin O'Brien"],
    roots: ["Chattanooga Parks & Outdoors", "Trust for Public Land"],
    waterHave: [
      "Water hookup available at Camp Jordan restrooms",
      "Flat concrete pad area at entrance",
      "East Ridge Parks support",
    ],
    waterNeed: [
      "Splash pad equipment and jets",
      "Recirculating water system",
      "Concrete pad construction",
      "Seasonal maintenance contract",
    ],
  },

  // =========================================================================
  // BALANCED GROWTH (10)
  // =========================================================================
  {
    name: "Main Street Bike-Priority Corridor to Riverwalk",
    summary:
      "Establish a bike-priority corridor on Main Street linking the Southside district to the Tennessee Riverwalk, using painted bike lanes, shared lane markings, and traffic calming features. The corridor would give cyclists a comfortable, direct route from the restaurants and shops of Southside to the riverfront trail.\n\nMain Street is already lower-traffic than parallel routes, making it ideal for bike priority treatment. Sharrows, green-painted conflict zones at intersections, and speed tables would signal to drivers that bikes belong here. The corridor connects two of Chattanooga's most vibrant areas and would encourage car-free trips between them.",
    category: "balanced_growth",
    lat: 35.037,
    lng: -85.306,
    address: "Main Street, Southside, Chattanooga, TN",
    gardeners: ["Carlos Rivera", "Terrence Brooks", "Lily Cheng"],
    roots: ["Bike Chattanooga", "River City Company"],
    waterHave: [
      "Low existing traffic volume on Main Street",
      "Southside business district support",
      "City bike plan identifies this corridor",
    ],
    waterNeed: [
      "Bike lane paint and sharrow markings",
      "Two speed table installations",
      "Green conflict zone paint at intersections",
      "Signage and wayfinding",
    ],
  },
  {
    name: "Dodds Avenue Volunteer Tree Planting",
    summary:
      "Organize a volunteer tree planting along Dodds Avenue near East Lake Park, adding 50 shade trees to a corridor that currently has minimal tree canopy. The trees would provide shade, reduce urban heat, improve air quality, and make walking along Dodds Avenue more comfortable.\n\nDodds Avenue is a key connector between neighborhoods and the South Chick Greenway, but it's an exposed, hot walk in summer. Strategic tree planting would transform the experience of walking or biking this corridor over the next 5-10 years as trees mature. Species would be selected for drought tolerance, native habitat value, and canopy spread.",
    category: "balanced_growth",
    lat: 35.024,
    lng: -85.281,
    address: "Dodds Avenue near East Lake Park, Chattanooga, TN",
    gardeners: ["Amara Diop", "Ryan Sato"],
    roots: [
      "Trust for Public Land",
      "Green|Spaces",
      "Chattanooga Parks & Outdoors",
    ],
    waterHave: [
      "Tree planting sites identified in right-of-way",
      "Tennessee Division of Forestry seedling program",
      "50 volunteer commitments from neighborhood",
    ],
    waterNeed: [
      "50 native shade trees (2-inch caliper)",
      "Mulch and tree guards",
      "Watering plan for first two summers",
      "Arborist consultation for species selection",
    ],
  },
  {
    name: "South Chick Creek No-Mow Buffer Signs",
    summary:
      "Install educational no-mow zone signs along South Chickamauga Creek tributaries, establishing and explaining creek buffer zones that protect water quality through natural vegetation. The signs would explain why unmowed buffer zones along streams prevent erosion, filter pollutants, and provide wildlife habitat.\n\nMany property owners and maintenance crews along South Chick Creek tributaries mow right up to the water's edge, removing the native vegetation that protects the creek. Simple, attractive signs explaining the purpose of buffer zones — combined with a voluntary no-mow pledge program — would shift behavior and improve water quality across the watershed.",
    category: "balanced_growth",
    lat: 35.028,
    lng: -85.265,
    address: "South Chickamauga Creek tributaries, Chattanooga, TN",
    gardeners: ["Sarah Chen", "Omar Washington"],
    roots: [
      "Tennessee Wildlife Resources Agency",
      "Chattanooga Audubon Society",
    ],
    waterHave: [
      "Creek buffer best practices guide developed",
      "Tennessee Clean Water Act grant eligible",
      "Property owner outreach list compiled",
    ],
    waterNeed: [
      "30 interpretive signs designed and fabricated",
      "Post and mounting hardware",
      "Outreach coordinator for pledge program",
    ],
  },
  {
    name: "Glass Street Pocket Park on South Chick Corridor",
    summary:
      "Convert an underused vacant lot on the South Chickamauga Greenway corridor near Glass Street into a pocket park with benches, shade trees, a little free library, and a community bulletin board. The pocket park would serve as a neighborhood gathering spot and greenway rest point.\n\nThe Glass Street area is experiencing grassroots revitalization, and a pocket park would signal that the neighborhood values public space. The lot is city-owned and currently maintained as empty grass. Transforming it into a welcoming pocket park would cost a fraction of a traditional park and serve the immediate community daily.",
    category: "balanced_growth",
    lat: 35.027,
    lng: -85.277,
    address: "Glass Street near South Chick Greenway, Chattanooga, TN",
    gardeners: ["Dante Lewis", "Maria Gonzalez", "Aisha Williams"],
    roots: ["Glass House Collective", "Trust for Public Land"],
    waterHave: [
      "City-owned vacant lot (0.15 acres)",
      "Glass House Collective community engagement",
      "Donated bench from local fabricator",
    ],
    waterNeed: [
      "Shade tree planting (5 trees)",
      "Little Free Library installation",
      "Community bulletin board construction",
      "Gravel path and seating area",
    ],
  },
  {
    name: "Alton Park Community Center Raised-Bed Gardens",
    summary:
      "Build raised-bed community gardens at Alton Park Community Center, providing neighborhood residents with space to grow vegetables, herbs, and flowers. The gardens would include 12 raised beds, a tool shed, a composting station, and a water hookup, managed by a volunteer garden committee.\n\nAlton Park is a food desert where many residents lack easy access to fresh produce. Community gardens address this directly while building neighborhood connections and teaching gardening skills. The community center is the natural hub — it already hosts youth programs, senior activities, and neighborhood meetings.",
    category: "balanced_growth",
    lat: 35.012,
    lng: -85.295,
    address: "Alton Park Community Center, Chattanooga, TN",
    gardeners: ["Priya Patel", "Andre Clark", "Fatima Hassan"],
    roots: ["Crabtree Farms", "Green|Spaces"],
    waterHave: [
      "Community center yard space available",
      "Water spigot accessible on building",
      "Crabtree Farms mentorship program",
      "Donated lumber for beds",
    ],
    waterNeed: [
      "Soil and compost for 12 beds",
      "Tool shed construction",
      "Fencing for garden area",
      "Seed and seedling starter kit",
    ],
  },
  {
    name: "Hardy Elementary Native Pollinator Gardens",
    summary:
      "Plant native pollinator gardens in the Hardy Elementary schoolyard, creating butterfly and bee habitat that doubles as an outdoor science classroom. The gardens would feature native milkweed, coneflower, bee balm, and other pollinator-supporting plants in three raised beds visible from classroom windows.\n\nPollinator populations are declining nationwide, and schoolyard gardens are a tangible way for students to participate in conservation. Hardy Elementary's yard has sunny, underused areas perfect for pollinator beds. Teachers would integrate the gardens into science curriculum, and students would maintain them during the school year.",
    category: "balanced_growth",
    lat: 35.022,
    lng: -85.285,
    address: "Hardy Elementary School, Chattanooga, TN",
    gardeners: ["Emily Thornton", "Grace Nakamura"],
    roots: ["Hamilton County Schools", "Chattanooga Audubon Society"],
    waterHave: [
      "Sunny schoolyard area approved for gardens",
      "Teacher integration plan for science classes",
      "Parent volunteer garden committee formed",
    ],
    waterNeed: [
      "Native pollinator plant starts (200 plants)",
      "Raised bed construction materials",
      "Interpretive signage about pollinators",
      "Drip irrigation hookup",
    ],
  },
  {
    name: "Moccasin Bend Wetland Restoration near Blue Blazes",
    summary:
      "Restore degraded wetland areas near the Blue Blazes Trailhead on Moccasin Bend, removing invasive species and replanting native wetland vegetation. The restoration would improve habitat for migratory birds, filter stormwater, and enhance the natural character of this historically significant landscape.\n\nMoccasin Bend's wetlands have been degraded by invasive privet and honeysuckle, which crowd out native plants that support wildlife. Restoration work would involve volunteer workdays to remove invasives, followed by native plantings of cardinal flower, blue flag iris, and other wetland species. The project would be visible from the trail, showing visitors what healthy wetlands look like.",
    category: "balanced_growth",
    lat: 35.055,
    lng: -85.34,
    address: "Blue Blazes Trailhead, Moccasin Bend, Chattanooga, TN",
    gardeners: ["Lena Petrova", "James Whitfield", "Kevin O'Brien"],
    roots: [
      "Friends of Moccasin Bend",
      "The Nature Conservancy",
      "Southeast Conservation Corps",
    ],
    waterHave: [
      "Invasive species survey completed",
      "Native plant nursery stock reserved",
      "NPS partnership for site access",
    ],
    waterNeed: [
      "Invasive removal crew (3 weekend workdays)",
      "Native wetland plants (500 plugs)",
      "Erosion control blankets",
      "Post-planting monitoring plan",
    ],
  },
  {
    name: "Stringer's Ridge Conservation Signage",
    summary:
      "Install conservation education signage along the ridge edge trails on Stringer's Ridge, explaining the preserve's unique geology, plant communities, and wildlife. The signs would be placed at five viewpoints where hikers naturally pause, turning rest stops into learning moments.\n\nStringer's Ridge is a rare urban nature preserve with diverse habitats, but most visitors experience it as a generic hiking trail. Interpretive signage would deepen appreciation for the preserve's ecology — the cedar glades, the spring wildflowers, the migratory birds that use the ridge as a flyway corridor — and build support for its long-term conservation.",
    category: "balanced_growth",
    lat: 35.067,
    lng: -85.314,
    address: "Stringer's Ridge Nature Preserve, Chattanooga, TN",
    gardeners: ["David Kim", "Rachel Foster"],
    roots: ["Chattanooga Audubon Society", "Scenic City Trail Runners"],
    waterHave: [
      "Five viewpoint locations identified",
      "Ecological survey data available",
      "Preserve management plan supports signage",
    ],
    waterNeed: [
      "Interpretive sign design and fabrication (5 signs)",
      "Mounting posts and hardware",
      "Trail-side installation",
    ],
  },
  {
    name: "Broad Street Container Native Plantings",
    summary:
      "Place large container planters with native grasses, wildflowers, and small shrubs along the Broad Street sidewalks downtown, adding greenery and pollinator habitat to the city's main commercial corridor. The containers would use a curated palette of native plants that bloom in succession across seasons.\n\nBroad Street is Chattanooga's signature downtown street, but its sidewalks are mostly hardscape. Container plantings are a fast, flexible way to add green without tearing up pavement. Using native plants rather than ornamental annuals creates real ecological value — supporting pollinators and demonstrating that native landscapes can be beautiful in urban settings.",
    category: "balanced_growth",
    lat: 35.045,
    lng: -85.31,
    address: "Broad Street, Downtown Chattanooga, TN",
    gardeners: ["Jasmine Tran", "Nadia Alvarez"],
    roots: ["River City Company", "Green|Spaces"],
    waterHave: [
      "Sidewalk space for containers identified",
      "Downtown business district support",
      "Native plant palette designed",
    ],
    waterNeed: [
      "20 large commercial planters",
      "Native plant starts and soil mix",
      "Drip irrigation system for containers",
      "Seasonal maintenance agreement",
    ],
  },
  {
    name: "Highland Park Stormwater Mural",
    summary:
      "Paint a large stormwater education mural on a retaining wall in Highland Park near Main and Willow streets, using art to explain how rain flows through the neighborhood to South Chick Creek. The mural would trace the path of a raindrop from rooftop to storm drain to creek, showing how everyday actions affect water quality.\n\nHighland Park has flooding issues tied to impervious surfaces and undersized storm drains. A mural that makes stormwater visible and understandable would build community awareness while beautifying a blank wall. The project would involve local artists and neighborhood youth in the design and painting process.",
    category: "balanced_growth",
    lat: 35.03,
    lng: -85.288,
    address: "Highland Park near Main and Willow, Chattanooga, TN",
    gardeners: ["Terrence Brooks", "Sofia Ruiz", "Amara Diop"],
    roots: ["Glass House Collective", "Chattanooga Design Studio"],
    waterHave: [
      "Retaining wall owner permission granted",
      "Local muralist interested in project",
      "Stormwater data from city engineering",
    ],
    waterNeed: [
      "Exterior mural paint and supplies",
      "Artist commission ($5K)",
      "Wall preparation and primer",
      "Youth workshop facilitation",
    ],
  },

  // =========================================================================
  // RESPECT (10)
  // =========================================================================
  {
    name: "Moccasin Bend Indigenous History Interpretive Signage",
    summary:
      "Install interpretive signage at Moccasin Bend acknowledging the site's deep Indigenous history, including its significance to Cherokee, Creek, and earlier peoples who lived along the Tennessee River for thousands of years. The signs would be developed in consultation with tribal representatives and historians.\n\nMoccasin Bend is one of the most archaeologically significant sites in the southeastern United States, with evidence of continuous human habitation spanning over 12,000 years. Despite its designation as a National Historic Landmark, most visitors encounter little information about this profound history. Respectful, accurate interpretive signage would honor the Indigenous peoples who shaped this landscape.",
    category: "respect",
    lat: 35.062,
    lng: -85.335,
    address: "Moccasin Bend, Chattanooga, TN",
    gardeners: ["Hannah Okafor", "James Whitfield", "Grace Nakamura"],
    roots: [
      "Friends of Moccasin Bend",
      "The Nature Conservancy",
      "Outdoor Chattanooga",
    ],
    waterHave: [
      "National Park Service site management partnership",
      "Archaeological survey documentation",
      "Initial contact with Eastern Band of Cherokee",
    ],
    waterNeed: [
      "Tribal consultation process (multiple meetings)",
      "Interpretive sign design by Indigenous-led firm",
      "Fabrication and installation of signs",
      "Ongoing relationship with tribal representatives",
    ],
  },
  {
    name: "South Chick Greenway Civil Rights History Marker",
    summary:
      "Install a Civil Rights history marker on the South Chickamauga Greenway near Orchard Knob, recognizing the neighborhood's role in Chattanooga's Civil Rights movement. The marker would tell the story of the activists, churches, and community organizations that fought for integration and justice in this part of the city.\n\nOrchard Knob and the surrounding neighborhoods were central to Chattanooga's Civil Rights struggle, but most greenway users pass through without knowing this history. A well-designed marker would connect the trail experience to the deeper story of the community it serves, honoring the people who fought for the rights we exercise when we freely walk these paths.",
    category: "respect",
    lat: 35.038,
    lng: -85.292,
    address: "South Chick Greenway near Orchard Knob, Chattanooga, TN",
    gardeners: ["DeShawn Mitchell", "Aisha Williams"],
    roots: ["Glass House Collective", "Outdoor Chattanooga"],
    waterHave: [
      "Historical research compiled by local historians",
      "Greenway easement for marker placement",
      "Community support from Orchard Knob neighborhood",
    ],
    waterNeed: [
      "Historical marker design and fabrication",
      "Community review of text content",
      "Foundation and installation",
    ],
  },
  {
    name: "Orchard Knob Community Orchard with Heritage Fruit Trees",
    summary:
      "Plant a community orchard at Orchard Knob Park featuring heritage fruit tree varieties historically grown in the Tennessee Valley — apples, pears, plums, and persimmons. The orchard would honor the neighborhood's name, provide free fruit for residents, and preserve heirloom varieties.\n\nOrchard Knob's name recalls a time when fruit orchards dotted this landscape. Restoring a small orchard reconnects the neighborhood to its agricultural heritage while providing a practical community resource. Heritage varieties are chosen for flavor, disease resistance, and cultural significance. The orchard would be maintained by neighborhood volunteers with support from Crabtree Farms.",
    category: "respect",
    lat: 35.038,
    lng: -85.289,
    address: "Orchard Knob Park, Chattanooga, TN",
    gardeners: ["Maria Gonzalez", "Andre Clark", "Rachel Foster"],
    roots: ["Crabtree Farms", "Chattanooga Parks & Outdoors"],
    waterHave: [
      "Park department approval for orchard site",
      "Heritage variety rootstock sourced",
      "Volunteer maintenance committee formed",
    ],
    waterNeed: [
      "20 heritage fruit trees",
      "Tree guards and stakes",
      "Drip irrigation installation",
      "Interpretive signs about heritage varieties",
    ],
  },
  {
    name: "North Chick Greenway Adopt-a-Trail Signage",
    summary:
      "Install Adopt-a-Trail signage for designated sections of the North Chickamauga Greenway, recognizing community groups, businesses, and families who commit to regular trail maintenance. Each adopted section would have a sign identifying the caretaker and their commitment.\n\nAdopt-a-Trail programs build community ownership of public spaces. When people see a familiar name on a trail sign, they feel a personal connection to that section — and they're more likely to pick up litter, report damage, and volunteer. The North Chick Greenway has enthusiastic user groups but no formal stewardship structure.",
    category: "respect",
    lat: 35.09,
    lng: -85.232,
    address: "North Chick Greenway, Chattanooga, TN",
    gardeners: ["Tyler Reed", "Eli Cooper"],
    roots: ["Outdoor Chattanooga", "Southeast Conservation Corps"],
    waterHave: [
      "Trail section map with maintenance zones defined",
      "12 community groups expressing interest",
      "Outdoor Chattanooga program framework",
    ],
    waterNeed: [
      "Adopt-a-Trail signs (12 sections)",
      "Sign posts and mounting hardware",
      "Program coordinator for first year",
    ],
  },
  {
    name: "Avondale Greenway Entrance Monthly Cleanup Event",
    summary:
      "Establish a recurring monthly cleanup event at the Avondale entrance to the South Chickamauga Greenway, providing supplies, coordination, and community building around trail stewardship. Each event would include trash pickup along a one-mile section, invasive plant removal, and a community breakfast.\n\nThe Avondale greenway entrance accumulates litter from nearby roads and illegal dumping. Regular cleanups would keep the trail welcoming while building a stewardship community. The monthly cadence creates a habit — neighbors begin to see the cleanup as a social event as much as a service project.",
    category: "respect",
    lat: 35.016,
    lng: -85.272,
    address: "Avondale Greenway entrance, Chattanooga, TN",
    gardeners: ["Fatima Hassan", "Dante Lewis", "Priya Patel"],
    roots: ["Green|Spaces", "Outdoor Chattanooga"],
    waterHave: [
      "Monthly event schedule set for 12 months",
      "Trash bags and gloves donated by local hardware store",
      "Social media promotion through neighborhood groups",
    ],
    waterNeed: [
      "Dumpster rental for monthly events",
      "Breakfast supplies for volunteers",
      "Invasive removal tools (loppers, saws)",
      "Event liability insurance",
    ],
  },
  {
    name: "North Chick Greenway Wildlife Corridor Signs",
    summary:
      "Install wildlife corridor awareness signs at trail crossings on the North Chickamauga Greenway where animal movement paths intersect the trail. The signs would educate users about the wildlife that shares the corridor — deer, foxes, box turtles, songbirds — and request respectful behavior like keeping dogs leashed.\n\nGreenways function as wildlife corridors connecting habitat patches across the urban landscape. Most trail users don't realize they're sharing the path with diverse wildlife, especially during dawn and dusk crossings. Educational signs at documented crossing points would build awareness and encourage behaviors that let people and wildlife coexist.",
    category: "respect",
    lat: 35.088,
    lng: -85.238,
    address: "North Chick Greenway trail crossings, Chattanooga, TN",
    gardeners: ["Lena Petrova", "Sarah Chen"],
    roots: [
      "Chattanooga Audubon Society",
      "Tennessee Wildlife Resources Agency",
    ],
    waterHave: [
      "Wildlife crossing data from trail cameras",
      "Audubon species inventory for corridor",
      "Sign content drafted by wildlife biologist",
    ],
    waterNeed: [
      "8 interpretive signs fabricated",
      "Posts and installation hardware",
      "Trail camera maintenance for ongoing monitoring",
    ],
  },
  {
    name: "Greenway Farms Dark-Sky Compliant Lighting",
    summary:
      "Replace existing parking lot lights at the Greenway Farms trailhead with dark-sky compliant fixtures that direct light downward, reducing light pollution that disrupts nocturnal wildlife along the North Chickamauga Greenway. The new fixtures would maintain safety while dramatically reducing sky glow.\n\nThe Greenway Farms parking lot's current lights are unshielded, casting light horizontally and upward into the adjacent greenway corridor. This disrupts the feeding patterns of bats, confuses migratory birds, and wastes energy. Dark-sky compliant fixtures provide better ground-level illumination with 60% less energy use and near-zero upward light spill.",
    category: "respect",
    lat: 35.1,
    lng: -85.22,
    address: "Greenway Farms parking lot, Chattanooga, TN",
    gardeners: ["Brian Sullivan", "Jake Patterson"],
    roots: ["Outdoor Chattanooga", "Green|Spaces"],
    waterHave: [
      "Current light audit completed",
      "Dark-sky fixture specifications identified",
      "TVA energy efficiency rebate eligible",
    ],
    waterNeed: [
      "8 dark-sky compliant LED fixtures",
      "Electrician for installation",
      "Old fixture removal and recycling",
    ],
  },
  {
    name: "Reflection Riding Native Plant Demonstration Bed",
    summary:
      "Create a native plant demonstration bed at Reflection Riding Arboretum & Nature Center showcasing Tennessee native plants organized by habitat type — woodland, meadow, wetland, and rock garden. The bed would serve as a model for homeowners wanting to landscape with native plants.\n\nMany Chattanooga residents want to plant natives but don't know where to start. A demonstration garden at Reflection Riding — already a destination for nature lovers — would show what native landscapes look like when thoughtfully designed. Each section would be labeled with species names, habitat requirements, and wildlife value, giving visitors a shopping list for their own yards.",
    category: "respect",
    lat: 35.018,
    lng: -85.353,
    address: "Reflection Riding Arboretum, Chattanooga, TN",
    gardeners: ["Emily Thornton", "Amara Diop", "Kevin O'Brien"],
    roots: [
      "Reflection Riding Arboretum & Nature Center",
      "Chattanooga Audubon Society",
    ],
    waterHave: [
      "Demonstration garden site approved by Reflection Riding",
      "Plant list curated by staff botanist",
      "Master gardener volunteer crew",
    ],
    waterNeed: [
      "Native plant starts (300 plants across 4 habitats)",
      "Garden bed preparation and soil amendment",
      "Interpretive labels and signage",
      "Drip irrigation for establishment period",
    ],
  },
  {
    name: '"Respect the River" Mural near Ross\'s Landing',
    summary:
      "Commission a large-scale mural near Ross's Landing celebrating the Tennessee River's ecological and cultural importance, with a \"Respect the River\" theme. The mural would depict native aquatic life, river history, and the community's connection to the waterway, painted on a prominent wall visible from the Riverwalk.\n\nThe Tennessee River is Chattanooga's defining natural feature, but it can feel like backdrop rather than protagonist. A striking mural at the city's primary riverfront gathering place would remind residents and visitors that the river is a living system deserving respect — not just a scenic amenity. The project would engage local artists and schools in the design process.",
    category: "respect",
    lat: 35.056,
    lng: -85.311,
    address: "Near Ross's Landing, Chattanooga, TN",
    gardeners: ["Sofia Ruiz", "Terrence Brooks"],
    roots: ["River City Company", "Chattanooga Design Studio"],
    waterHave: [
      "Wall owner permission secured",
      "Local muralist team assembled",
      "River ecology content from Tennessee Aquarium",
    ],
    waterNeed: [
      "Mural paint and supplies ($3K)",
      "Artist commission ($8K)",
      "Scaffolding rental",
      "Wall preparation and sealing",
    ],
  },
  {
    name: "Moccasin Bend Trail Wheelchair Accessible Surfacing",
    summary:
      "Upgrade a one-mile section of the Moccasin Bend Trail with wheelchair-accessible surfacing, ensuring that people with mobility challenges can experience this nationally significant landscape. The current trail surface is uneven packed earth with roots and rocks that prevent wheelchair and adaptive equipment use.\n\nMoccasin Bend's trails traverse one of the most important archaeological and natural sites in the Southeast, but accessibility barriers exclude many community members from experiencing it. An accessible surface — stabilized crushed stone or boardwalk over wet areas — would open this irreplaceable landscape to everyone while meeting ADA guidelines.",
    category: "respect",
    lat: 35.058,
    lng: -85.34,
    address: "Moccasin Bend Trail, Chattanooga, TN",
    gardeners: ["Nadia Alvarez", "Omar Washington", "David Kim"],
    roots: [
      "Friends of Moccasin Bend",
      "Outdoor Chattanooga",
      "Trust for Public Land",
    ],
    waterHave: [
      "Trail route surveyed for accessibility",
      "NPS approval for surface improvements",
      "ADA compliance plan developed",
    ],
    waterNeed: [
      "Stabilized crushed stone surface material",
      "Boardwalk sections for wet areas (200 linear feet)",
      "Grade adjustments at steep points",
      "Accessible trailhead signage",
    ],
  },

  // =========================================================================
  // CONNECTED COMMUNITIES (10)
  // =========================================================================
  {
    name: "South Chick Greenway to Brainerd Road Bike Connection",
    summary:
      "Build a bike connection from the South Chickamauga Greenway to Brainerd Road, closing a gap that currently forces cyclists onto high-speed roads to reach one of East Chattanooga's main commercial corridors. The connection would use a combination of protected bike lane and multi-use path along an existing utility easement.\n\nBrainerd Road has grocery stores, restaurants, and services that greenway-adjacent neighborhoods need, but there's no safe cycling route to reach them. This connection would turn the greenway from a recreation loop into a transportation network, enabling car-free trips for errands and commuting.",
    category: "connected_communities",
    lat: 35.02,
    lng: -85.25,
    address: "South Chick Greenway at Brainerd Road, Chattanooga, TN",
    gardeners: ["Carlos Rivera", "Marcus Jones", "Lily Cheng"],
    roots: ["Bike Chattanooga", "CARTA"],
    waterHave: [
      "Utility easement route identified",
      "City bike master plan supports connection",
      "Brainerd Road business association support",
    ],
    waterNeed: [
      "Multi-use path construction (0.4 miles)",
      "Protected bike lane striping on connector road",
      "Signage and wayfinding",
      "Traffic signal modification at Brainerd intersection",
    ],
  },
  {
    name: "Community Gardens Bike Streets Map",
    summary:
      "Create a printed and digital map linking Chattanooga's community gardens via low-traffic bike streets, helping gardeners, volunteers, and curious residents visit gardens by bike. The map would show garden locations, hours, what's growing, and the safest bike routes connecting them.\n\nChattanooga has a growing network of community gardens but no resource connecting them to each other or to the cycling network. A bike-garden map would encourage cross-pollination between gardening and cycling communities, help new residents discover gardens near them, and promote car-free trips to gardens for drop-in volunteering and produce pickup.",
    category: "connected_communities",
    lat: 35.04,
    lng: -85.295,
    address: "Chattanooga community gardens, TN",
    gardeners: ["Grace Nakamura", "Priya Patel"],
    roots: ["Crabtree Farms", "Bike Chattanooga", "Green|Spaces"],
    waterHave: [
      "Community garden location database",
      "Bike street network mapped by Bike Chattanooga",
      "Graphic designer volunteer",
    ],
    waterNeed: [
      "Map printing (1,000 copies)",
      "Digital interactive map development",
      "Garden profile content collection",
      "Distribution to bike shops and libraries",
    ],
  },
  {
    name: '"Ridge to River" Walking Event',
    summary:
      "Organize a \"Ridge to River\" community walking event from Stringer's Ridge to the Walnut Street Bridge, a roughly 2-mile route that showcases the dramatic topographic variety of Chattanooga's North Shore. The event would be held quarterly, with volunteer guides explaining the history, ecology, and community stories along the route.\n\nChattanooga's landscape tells a story from ridgetop to riverbank — geological history, neighborhood development, conservation efforts — but you have to walk it to feel it. The Ridge to River event would create a shared community experience that builds appreciation for the North Shore's unique geography and connects neighbors who might otherwise never meet.",
    category: "connected_communities",
    lat: 35.063,
    lng: -85.313,
    address: "Stringer's Ridge to Walnut St Bridge, Chattanooga, TN",
    gardeners: ["Jake Patterson", "Hannah Okafor", "Terrence Brooks"],
    roots: ["Scenic City Trail Runners", "Outdoor Chattanooga"],
    waterHave: [
      "Walking route mapped and tested",
      "Volunteer guides trained (6 people)",
      "Event permits from parks department",
    ],
    waterNeed: [
      "Event promotion and registration platform",
      "Printed route maps for participants",
      "Water station supplies for two aid points",
      "Photographer for event documentation",
    ],
  },
  {
    name: "UTC Student Trail Ambassador Program on Riverwalk",
    summary:
      "Launch a UTC student Trail Ambassador program on the Tennessee Riverwalk, training university students to serve as friendly, visible trail hosts during peak hours. Ambassadors would answer questions, share trail history, report maintenance issues, and create a welcoming atmosphere for all users.\n\nThe Riverwalk is Chattanooga's front porch, but it can feel anonymous during busy times. Student ambassadors — wearing distinctive vests and carrying maps — would add a human presence that makes the trail feel safer and more welcoming. The program would give UTC students community service hours, outdoor experience, and connection to the city beyond campus.",
    category: "connected_communities",
    lat: 35.0475,
    lng: -85.3075,
    address: "UTC campus / Tennessee Riverwalk, Chattanooga, TN",
    gardeners: ["Ryan Sato", "Jasmine Tran"],
    roots: ["UTC Office of Sustainability", "Tennessee Riverpark Conservancy"],
    waterHave: [
      "UTC service-learning credit approval",
      "Ambassador training curriculum drafted",
      "Riverwalk schedule of peak usage hours",
    ],
    waterNeed: [
      "Ambassador vests and identification badges",
      "Trail maps and FAQ reference cards",
      "Program coordinator stipend",
      "First aid kits for ambassadors",
    ],
  },
  {
    name: "Stringer's Ridge Volunteer Trail Maintenance Day",
    summary:
      "Organize a recurring volunteer trail maintenance day at Stringer's Ridge, bringing together neighbors, trail runners, mountain bikers, and hikers to maintain and improve the preserve's trail network. Each event would focus on a specific section, with tasks like erosion repair, drainage clearing, and bench maintenance.\n\nStringer's Ridge trails are loved hard — heavy use means constant maintenance needs. A regular volunteer maintenance program would keep trails in good condition while building a stewardship community that feels personal ownership of the preserve. Events would include tool training, shared lunch, and a brief ecology talk.",
    category: "connected_communities",
    lat: 35.066,
    lng: -85.315,
    address: "Stringer's Ridge Nature Preserve, Chattanooga, TN",
    gardeners: ["Tyler Reed", "Emily Thornton", "DeShawn Mitchell"],
    roots: ["Scenic City Trail Runners", "Southeast Conservation Corps"],
    waterHave: [
      "Trail maintenance tool cache at trailhead",
      "Monthly event schedule established",
      "Insurance through Outdoor Chattanooga",
    ],
    waterNeed: [
      "Trail maintenance materials (gravel, water bars)",
      "Lunch supplies for volunteers",
      "Tool replacement and sharpening",
    ],
  },
  {
    name: "Vine Street Protected Bike Lane from UTC to Riverwalk",
    summary:
      "Install a protected bike lane on Vine Street from UTC's campus down to the Tennessee Riverwalk, creating a safe, direct cycling connection between the university and the riverfront. The lane would use flexible delineator posts and green-painted conflict zones at intersections.\n\nVine Street is the most direct route from UTC to the Riverwalk, but current traffic conditions make it uncomfortable for all but the most confident cyclists. A protected lane would transform this corridor into a genuine bike commute route, connecting thousands of students to the trail network and encouraging car-free living for the campus community.",
    category: "connected_communities",
    lat: 35.046,
    lng: -85.306,
    address: "Vine Street, Chattanooga, TN",
    gardeners: ["Carlos Rivera", "Aisha Williams"],
    roots: ["Bike Chattanooga", "UTC Office of Sustainability", "CARTA"],
    waterHave: [
      "City bike plan identifies Vine Street corridor",
      "UTC student government resolution supporting project",
      "Traffic study completed",
    ],
    waterNeed: [
      "Flexible delineator posts (200 units)",
      "Green thermoplastic for conflict zones",
      "Lane marking paint",
      "Bike signal at MLK Boulevard intersection",
    ],
  },
  {
    name: "Highland Park Neighborhood Walking Loop",
    summary:
      "Create a marked neighborhood walking loop in Highland Park circling through Tatum Park, residential streets, and local landmarks, with painted distance markers and interpretive signs about the neighborhood's history. The loop would be approximately one mile, making it a convenient daily exercise route.\n\nHighland Park has beautiful residential streets, mature trees, and a strong community identity, but no designated walking route to showcase it. A marked loop would encourage daily walking, help new residents explore the neighborhood, and give Highland Park a signature feature that builds community pride. The interpretive signs would tell stories nominated by long-time residents.",
    category: "connected_communities",
    lat: 35.031,
    lng: -85.287,
    address: "Highland Park / Tatum Park, Chattanooga, TN",
    gardeners: ["Dante Lewis", "Maria Gonzalez", "Brian Sullivan"],
    roots: ["Glass House Collective", "Outdoor Chattanooga"],
    waterHave: [
      "Walking route designed with neighborhood input",
      "Tatum Park permission for loop connection",
      "Neighborhood history compiled by local historian",
    ],
    waterNeed: [
      "Distance marker posts (8 total)",
      "Interpretive sign design and fabrication (4 signs)",
      "Sidewalk paint for route markings",
    ],
  },
  {
    name: "Camp Jordan Greenway Bike Share Dock",
    summary:
      "Install a bike share dock at the Camp Jordan Greenway entrance, connecting East Ridge to the regional bike share network and enabling one-way trips between the greenway and downtown Chattanooga. The dock would hold 10 bikes and include a solar-powered payment kiosk.\n\nCamp Jordan is a popular greenway destination but isolated from the bike share system, which currently stops well west of East Ridge. A dock here would let visitors ride the greenway and return downtown by bike share, or vice versa. It would also give East Ridge residents a new transit option for reaching destinations along the bike share network.",
    category: "connected_communities",
    lat: 35.043,
    lng: -85.206,
    address: "Camp Jordan Greenway entrance, East Ridge, TN",
    gardeners: ["Fatima Hassan", "Omar Washington"],
    roots: ["Bike Chattanooga", "CARTA"],
    waterHave: [
      "Bike Chattanooga expansion plan includes East Ridge",
      "Camp Jordan site approved for dock",
      "Solar power feasibility confirmed",
    ],
    waterNeed: [
      "Bike share dock station hardware",
      "10 bike share bikes allocated",
      "Solar panel and payment kiosk",
      "Concrete pad for dock installation",
    ],
  },
  {
    name: "Frazier Avenue Parklet near Coolidge Park",
    summary:
      "Convert two parking spaces on Frazier Avenue near Coolidge Park into a parklet — a small public seating area with planters, benches, and bike parking that extends the sidewalk into the street. The parklet would serve the busy North Shore commercial district where sidewalk space is limited.\n\nFrazier Avenue is the North Shore's main street, packed with restaurants, shops, and foot traffic from Coolidge Park visitors. Sidewalks are narrow and crowded, especially on weekends. A parklet would add needed public seating, create a neighborhood gathering spot, and demonstrate that people-space is more valuable than car-storage space on this vibrant corridor.",
    category: "connected_communities",
    lat: 35.061,
    lng: -85.3085,
    address: "Frazier Avenue, North Shore, Chattanooga, TN",
    gardeners: ["Nadia Alvarez", "David Kim", "Lena Petrova"],
    roots: ["River City Company", "Chattanooga Design Studio"],
    waterHave: [
      "North Shore business association support",
      "City parklet permit framework exists",
      "Adjacent business willing to maintain",
    ],
    waterNeed: [
      "Parklet platform construction",
      "Planters and seating furniture",
      "Bike rack integration",
      "Reflective safety barriers",
    ],
  },
  {
    name: "Riverwalk / Walnut Street Bridge Unified Wayfinding",
    summary:
      "Install unified wayfinding signage at the junction of the Tennessee Riverwalk and the Walnut Street Bridge, one of Chattanooga's most important pedestrian crossroads. Current signage is inconsistent — different styles, different information, different eras — leaving visitors confused about which way to go.\n\nThis junction sees thousands of daily users: tourists walking from the aquarium, Riverwalk joggers, Walnut Bridge strollers, cyclists heading to Coolidge Park. A single, coherent wayfinding system with clear directional signs, distance estimates, and landmark callouts would help everyone navigate confidently and discover more of what Chattanooga's trail network offers.",
    category: "connected_communities",
    lat: 35.058,
    lng: -85.308,
    address: "Riverwalk / Walnut Street Bridge junction, Chattanooga, TN",
    gardeners: ["Eli Cooper", "Rachel Foster", "Andre Clark"],
    roots: [
      "River City Company",
      "Tennessee Riverpark Conservancy",
      "Chattanooga Design Studio",
    ],
    waterHave: [
      "Existing wayfinding audit completed",
      "Design standards from River City Company",
      "Junction site survey completed",
    ],
    waterNeed: [
      "Wayfinding sign design (6 panels)",
      "Fabrication and installation",
      "Removal of obsolete existing signs",
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const clean = process.argv.includes("--clean");
  const withImages = process.argv.includes("--with-images");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Did you create .env.local?");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  // --clean: remove seeded data
  if (clean) {
    console.log("Cleaning seeded data...");
    const seedUser = await db.query.users.findFirst({
      where: eq(schema.users.email, SEED_BOT_EMAIL),
    });
    if (seedUser) {
      // Delete seeds created by the seed bot (cascades to approvals and supports)
      await db
        .delete(schema.seeds)
        .where(eq(schema.seeds.createdBy, seedUser.id));
      // Delete fake supporter users
      await db
        .delete(schema.users)
        .where(like(schema.users.email, "supporter-%@seeds.example.com"));
      // Delete the seed bot user
      await db.delete(schema.users).where(eq(schema.users.id, seedUser.id));
    }
    console.log("Clean complete.");
    if (process.argv.includes("--clean-only")) {
      process.exit(0);
    }
  }

  // Create seed bot user
  let seedUser = await db.query.users.findFirst({
    where: eq(schema.users.email, SEED_BOT_EMAIL),
  });

  if (!seedUser) {
    const [created] = await db
      .insert(schema.users)
      .values({
        email: SEED_BOT_EMAIL,
        name: SEED_BOT_NAME,
        role: "admin",
      })
      .returning();
    seedUser = created;
    console.log(`Created seed bot user: ${seedUser.id}`);
  } else {
    console.log(`Seed bot user already exists: ${seedUser.id}`);
  }

  // Create supporter users for random sunlight counts
  const supporterCount = 20;
  const supporters: { id: string }[] = [];

  for (let i = 0; i < supporterCount; i++) {
    const email = `supporter-${i}@seeds.example.com`;
    let supporter = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    if (!supporter) {
      const [created] = await db
        .insert(schema.users)
        .values({
          email,
          name: PEOPLE[i % PEOPLE.length],
        })
        .returning();
      supporter = created;
    }
    supporters.push({ id: supporter.id });
  }
  console.log(`Ensured ${supporterCount} supporter users exist.`);

  // Insert seeds
  let inserted = 0;
  for (const seedData of SEEDS) {
    // Check if seed already exists by name
    const existing = await db.query.seeds.findFirst({
      where: eq(schema.seeds.name, seedData.name),
    });
    if (existing) {
      console.log(`  Skipping (exists): ${seedData.name}`);
      continue;
    }

    const [seed] = await db
      .insert(schema.seeds)
      .values({
        name: seedData.name,
        summary: seedData.summary,
        category: seedData.category,
        locationLat: seedData.lat,
        locationLng: seedData.lng,
        locationAddress: seedData.address,
        gardeners: seedData.gardeners,
        roots: seedData.roots.map((name) => ({ name, committed: false })),
        waterHave: seedData.waterHave,
        waterNeed: seedData.waterNeed,
        status: "approved",
        createdBy: seedUser.id,
      })
      .returning();

    // Create approval record
    await db.insert(schema.seedApprovals).values({
      seedId: seed.id,
      approvedBy: seedUser.id,
    });

    // Add random supports (1-12 supporters per seed)
    const numSupports = randInt(1, 12);
    const selectedSupporters = pick(supporters, numSupports);
    for (const supporter of selectedSupporters) {
      await db.insert(schema.seedSupports).values({
        seedId: seed.id,
        userId: supporter.id,
      });
    }

    inserted++;
    console.log(
      `  [${inserted}/${SEEDS.length}] ${seedData.name} (${numSupports} supporters)`,
    );
  }

  console.log(`\nDone! Inserted ${inserted} seeds.`);
  console.log(`Total seeds in data: ${SEEDS.length}`);

  // --with-images: generate images for seeds that don't have one
  if (withImages) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error(
        "\nSkipping image generation: GOOGLE_GENERATIVE_AI_API_KEY is not set.",
      );
      return;
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error(
        "\nSkipping image generation: BLOB_READ_WRITE_TOKEN is not set.",
      );
      return;
    }

    // Find all seeds created by seed bot that lack images
    const seedsWithoutImages = await db.query.seeds.findMany({
      where: (s, { eq: e, and }) =>
        and(e(s.createdBy, seedUser.id), isNull(s.imageUrl)),
    });

    if (seedsWithoutImages.length === 0) {
      console.log("\nAll seeds already have images.");
      return;
    }

    console.log(
      `\nGenerating images for ${seedsWithoutImages.length} seeds...`,
    );

    let imageCount = 0;
    for (const seed of seedsWithoutImages) {
      imageCount++;
      process.stdout.write(
        `  [${imageCount}/${seedsWithoutImages.length}] ${seed.name}... `,
      );

      try {
        const result = await generateImage(seed);
        if (result.error) {
          console.log(`FAILED: ${result.error}`);
          continue;
        }

        await db
          .update(schema.seeds)
          .set({ imageUrl: result.imageUrl, updatedAt: new Date() })
          .where(eq(schema.seeds.id, seed.id));

        console.log("OK");
      } catch (err) {
        console.log(`ERROR: ${err}`);
      }
    }

    console.log(`\nImage generation complete. Generated ${imageCount} images.`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
