import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { buildImagePrompt } from "@/lib/image-prompt";

/**
 * Generate a poster illustration for a project with Gemini and store it in
 * the public Blob store. Shared by the server action and the populate
 * script; neither touches the database here, so the caller decides what to
 * do with the URL.
 */

export const IMAGE_MODEL = "gemini-2.5-flash-image";
export const IMAGE_ASPECT_RATIO = "3:4";

export type PosterResult =
  | { imageUrl: string; error?: undefined }
  | { error: string; imageUrl?: undefined };

export async function generateProjectPoster(project: {
  id: string;
  name: string;
  summary: string;
  locationAddress: string | null;
  waterHave: string[];
}): Promise<PosterResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return { error: "Image generation is not configured." };

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: buildImagePrompt(project),
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: IMAGE_ASPECT_RATIO },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) return { error: "No image was generated." };

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
  return { imageUrl: blob.url };
}
