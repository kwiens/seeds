import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockSeed,
  mockDbUpdateChain,
} from "../../test-utils";

// Use vi.hoisted so mock fns are available inside vi.mock factories
const { mockGenerateContent, mockPut } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockPut: vi.fn(),
}));

// Mock external services
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: { seeds: { findFirst: vi.fn() } },
    update: vi.fn(),
  },
}));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  },
}));
vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  generateSeedImage,
  regenerateSeedImage,
} from "@/lib/actions/generate-image";

// Set API key for all tests
const originalEnv = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

function setupGeminiMock() {
  mockGenerateContent.mockResolvedValue({
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: "dGVzdGltYWdlZGF0YQ==", // base64 "testimagedata"
              },
            },
          ],
        },
      },
    ],
  });
  mockPut.mockResolvedValue({
    url: "https://blob.example.com/seeds/seed-1.png",
  });
}

describe("generateSeedImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-api-key";
  });

  afterAll(() => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalEnv;
  });

  it("requires authentication", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const result = await generateSeedImage("seed-1");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when seed not found", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(undefined);

    const result = await generateSeedImage("nonexistent");
    expect(result).toEqual({ error: "Seed not found." });
  });

  it("returns existing image URL without regenerating", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: "https://existing.com/image.png" }) as any,
    );

    const result = await generateSeedImage("seed-1");

    expect(result).toEqual({ imageUrl: "https://existing.com/image.png" });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("generates image when seed has no image", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await generateSeedImage("seed-1");

    expect(result).toEqual({
      imageUrl: "https://blob.example.com/seeds/seed-1.png",
    });
    expect(mockGenerateContent).toHaveBeenCalled();
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining("seeds/seed-1"),
      expect.any(Buffer),
      expect.objectContaining({ access: "public" }),
    );
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://blob.example.com/seeds/seed-1.png",
      }),
    );
  });

  it("returns error when API key is missing", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );

    const result = await generateSeedImage("seed-1");
    expect(result).toEqual({ error: "Image generation is not configured." });
  });

  it("returns error when Gemini returns no candidates", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    mockGenerateContent.mockResolvedValue({ candidates: [] });

    const result = await generateSeedImage("seed-1");
    expect(result).toEqual({ error: "No image was generated." });
  });

  it("returns error when Gemini returns no image data", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: "Some text" }] } }],
    });

    const result = await generateSeedImage("seed-1");
    expect(result).toEqual({ error: "No image data in response." });
  });

  it("handles Gemini API errors gracefully", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    mockGenerateContent.mockRejectedValue(new Error("API quota exceeded"));

    const result = await generateSeedImage("seed-1");
    expect(result).toEqual({
      error: "Failed to generate image. Please try again later.",
    });
  });

  it("revalidates paths after successful generation", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await generateSeedImage("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("regenerateSeedImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-api-key";
  });

  afterAll(() => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalEnv;
  });

  it("requires authentication", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const result = await regenerateSeedImage("seed-1");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when seed not found", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(undefined);

    const result = await regenerateSeedImage("nonexistent");
    expect(result).toEqual({ error: "Seed not found." });
  });

  it("rejects regeneration by non-owner non-admin", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );

    const result = await regenerateSeedImage("seed-1");
    expect(result).toEqual({
      error: "You don't have permission to regenerate this image.",
    });
  });

  it("allows owner to regenerate", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1", imageUrl: "https://old.com/img.png" }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await regenerateSeedImage("seed-1");

    expect(result).toEqual({
      imageUrl: "https://blob.example.com/seeds/seed-1.png",
    });
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("allows admin to regenerate any seed image", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "someone-else" }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await regenerateSeedImage("seed-1");

    expect(result).toEqual({
      imageUrl: "https://blob.example.com/seeds/seed-1.png",
    });
  });

  it("handles Gemini API errors gracefully", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );
    mockGenerateContent.mockRejectedValue(new Error("Service unavailable"));

    const result = await regenerateSeedImage("seed-1");
    expect(result).toEqual({
      error: "Failed to generate image. Please try again later.",
    });
  });
});
