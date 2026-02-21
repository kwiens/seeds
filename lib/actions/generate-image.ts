"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seeds } from "@/lib/db/schema";
import { buildImagePrompt } from "@/lib/image-prompt";

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

  const prompt = buildImagePrompt(seed);

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
