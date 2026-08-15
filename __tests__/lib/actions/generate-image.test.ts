import { afterAll, describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockSeed,
  mockDbUpdateChain,
  setAuthMock,
} from "../../test-utils";

// Use vi.hoisted so mock fns are available inside vi.mock factories
const { mockGenerateContent, mockPut } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockPut: vi.fn(),
}));

// Mock external services
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({
  canManageProject: vi.fn(
    async (session, project) =>
      session?.user?.role === "admin" ||
      session?.user?.id === project.createdBy,
  ),
}));
vi.mock("@/lib/db", () => ({
  db: {
    query: { projects: { findFirst: vi.fn() } },
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
  generateProjectImage,
  regenerateProjectImage,
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
    url: "https://blob.example.com/projects/seed-1.png",
  });
}

describe("generateProjectImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-api-key";
  });

  afterAll(() => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalEnv;
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);

    const result = await generateProjectImage("seed-1");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when seed not found", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(undefined);

    const result = await generateProjectImage("nonexistent");
    expect(result).toEqual({ error: "Project not found." });
  });

  it("returns existing image URL without regenerating", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: "https://existing.com/image.png" }) as any,
    );

    const result = await generateProjectImage("seed-1");

    expect(result).toEqual({ imageUrl: "https://existing.com/image.png" });
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("generates image when seed has no image", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await generateProjectImage("seed-1");

    expect(result).toEqual({
      imageUrl: "https://blob.example.com/projects/seed-1.png",
    });
    expect(mockGenerateContent).toHaveBeenCalled();
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining("projects/seed-1"),
      expect.anything(),
      expect.objectContaining({ access: "public" }),
    );
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://blob.example.com/projects/seed-1.png",
      }),
    );
  });

  it("returns error when API key is missing", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );

    const result = await generateProjectImage("seed-1");
    expect(result).toEqual({ error: "Image generation is not configured." });
  });

  it("returns error when Gemini returns no candidates", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    mockGenerateContent.mockResolvedValue({ candidates: [] });

    const result = await generateProjectImage("seed-1");
    expect(result).toEqual({ error: "No image was generated." });
  });

  it("returns error when Gemini returns no image data", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: "Some text" }] } }],
    });

    const result = await generateProjectImage("seed-1");
    expect(result).toEqual({ error: "No image data in response." });
  });

  it("handles Gemini API errors gracefully", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    mockGenerateContent.mockRejectedValue(new Error("API quota exceeded"));

    const result = await generateProjectImage("seed-1");
    expect(result).toEqual({
      error: "Failed to generate image. Please try again later.",
    });
  });

  it("revalidates paths after successful generation", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ imageUrl: null }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await generateProjectImage("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("regenerateProjectImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-api-key";
  });

  afterAll(() => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalEnv;
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);

    const result = await regenerateProjectImage("seed-1");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when seed not found", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(undefined);

    const result = await regenerateProjectImage("nonexistent");
    expect(result).toEqual({ error: "Project not found." });
  });

  it("rejects regeneration by non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );

    const result = await regenerateProjectImage("seed-1");
    expect(result).toEqual({
      error: "You don't have permission to regenerate this image.",
    });
  });

  it("allows owner to regenerate", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({
        createdBy: "user-1",
        imageUrl: "https://old.com/img.png",
      }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await regenerateProjectImage("seed-1");

    expect(result).toEqual({
      imageUrl: "https://blob.example.com/projects/seed-1.png",
    });
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("allows admin to regenerate any seed image", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "someone-else" }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await regenerateProjectImage("seed-1");

    expect(result).toEqual({
      imageUrl: "https://blob.example.com/projects/seed-1.png",
    });
  });

  it("handles Gemini API errors gracefully", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );
    mockGenerateContent.mockRejectedValue(new Error("Service unavailable"));

    const result = await regenerateProjectImage("seed-1");
    expect(result).toEqual({
      error: "Failed to generate image. Please try again later.",
    });
  });

  it("returns error when API key is missing", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );

    const result = await regenerateProjectImage("seed-1");
    expect(result).toEqual({ error: "Image generation is not configured." });
  });

  it("revalidates paths after successful regeneration", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeed({
        createdBy: "user-1",
        imageUrl: "https://old.com/img.png",
      }) as any,
    );
    setupGeminiMock();
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await regenerateProjectImage("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
