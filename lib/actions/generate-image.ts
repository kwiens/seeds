"use server";

import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { buildImagePrompt } from "@/lib/image-prompt";
import { revalidateProject } from "@/lib/revalidate";

type ImageResult =
  | { imageUrl: string; error?: undefined }
  | { error: string; imageUrl?: undefined };

// In-memory rate limiter: 10 requests per 10 minutes per user
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(userId, recent);
    return false;
  }
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

async function callGeminiAndUpload(project: {
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

  const prompt = buildImagePrompt(project);

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

  const blob = await put(`projects/${project.id}.${extension}`, imageBuffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: true,
  });

  if (!blob.url.startsWith("https://")) {
    return { error: "Unexpected storage URL format." };
  }

  await db
    .update(projects)
    .set({ imageUrl: blob.url, updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  revalidateProject(project.id);

  return { imageUrl: blob.url };
}

/** Generates a poster once; returns the existing image if there is one. */
export async function generateProjectImage(
  projectId: string,
): Promise<ImageResult> {
  return generateImage(projectId, {
    forbidden: "You don't have permission to generate an image for this seed.",
    keepExisting: true,
  });
}

/** Replaces the poster even if one already exists. */
export async function regenerateProjectImage(
  projectId: string,
): Promise<ImageResult> {
  return generateImage(projectId, {
    forbidden: "You don't have permission to regenerate this image.",
    keepExisting: false,
  });
}

async function generateImage(
  projectId: string,
  options: { forbidden: string; keepExisting: boolean },
): Promise<ImageResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: {
      id: true,
      name: true,
      summary: true,
      category: true,
      locationAddress: true,
      waterHave: true,
      imageUrl: true,
    },
  });
  if (!project) return { error: "Project not found." };
  if (!(await canManageProject(session, project))) {
    return { error: options.forbidden };
  }
  if (options.keepExisting && project.imageUrl) {
    return { imageUrl: project.imageUrl };
  }
  if (!checkRateLimit(session.user.id)) {
    return { error: "Too many image requests. Please try again later." };
  }

  try {
    return await callGeminiAndUpload(project);
  } catch (error) {
    console.error("Failed to generate seed image:", error);
    return { error: "Failed to generate image. Please try again later." };
  }
}
