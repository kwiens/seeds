"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seeds } from "@/lib/db/schema";
import { categories } from "@/lib/categories";

async function callGeminiAndUpload(seed: {
  id: string;
  name: string;
  summary: string;
  category: string;
  locationAddress: string | null;
  waterHave: string[];
}) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return { error: "Image generation is not configured." };
  }

  const categoryLabel = categories[seed.category]?.label ?? seed.category;
  const summarySnippet = seed.summary.slice(0, 500);

  const details: string[] = [];
  if (seed.locationAddress) {
    details.push(`Location: ${seed.locationAddress}.`);
  }
  if (seed.waterHave.length > 0) {
    details.push(`Resources available: ${seed.waterHave.join(", ")}.`);
  }

  const prompt = `Create a charming illustration for a community project in Chattanooga, Tennessee — a National Park City surrounded by mountains, rivers, and forests. The project is called "${seed.name}" in the "${categoryLabel}" category. Description: "${summarySnippet}". ${details.join(" ")} The setting is Southeast Tennessee — draw from the region's native wildlife and flora: box turtles, white-tailed deer, red-tailed hawks, eastern bluebirds, tulip poplars, dogwoods, rhododendrons, and mountain laurel. People here enjoy mountain biking, hiking, rock climbing, kayaking, paddleboarding, trail running, fishing, and community gardening. Weave relevant activities and local nature into the scene. Style: warm, inviting watercolor illustration with soft greens, earth tones, and golden light. The edges of the illustration should fade into pure white with an organic, irregular shape — as if the watercolor painting was done on torn paper placed on a white background. The white is not a frame or border; it is negative space where the painting simply ends, with rough, natural edges where paint meets white. Some elements like leaves or branches can extend into the white area. The mood should be hopeful and community-oriented. No text or words in the image.`;

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "1:1",
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

  await db
    .update(seeds)
    .set({ imageUrl: blob.url, updatedAt: new Date() })
    .where(eq(seeds.id, seed.id));

  revalidatePath(`/seeds/${seed.id}`);
  revalidatePath("/");

  return { imageUrl: blob.url };
}

export async function generateSeedImage(seedId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const seed = await db.query.seeds.findFirst({
    where: eq(seeds.id, seedId),
  });

  if (!seed) {
    return { error: "Seed not found." };
  }

  if (!canEditSeed(session, seed)) {
    return {
      error: "You don't have permission to generate an image for this seed.",
    };
  }

  if (seed.imageUrl) {
    return { imageUrl: seed.imageUrl };
  }

  try {
    return await callGeminiAndUpload(seed);
  } catch (error) {
    console.error("Failed to generate seed image:", error);
    return { error: "Failed to generate image. Please try again later." };
  }
}

export async function regenerateSeedImage(seedId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const seed = await db.query.seeds.findFirst({
    where: eq(seeds.id, seedId),
  });

  if (!seed) {
    return { error: "Seed not found." };
  }

  if (!canEditSeed(session, seed)) {
    return { error: "You don't have permission to regenerate this image." };
  }

  try {
    return await callGeminiAndUpload(seed);
  } catch (error) {
    console.error("Failed to regenerate seed image:", error);
    return { error: "Failed to generate image. Please try again later." };
  }
}
