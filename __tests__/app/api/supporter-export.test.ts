import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/queries/projects", () => ({
  getSupporterExportProject: vi.fn(),
  getSupporterExportChunk: vi.fn(),
}));
vi.mock("@/lib/project-access", () => ({ getProjectAccess: vi.fn() }));
import { auth } from "@/auth";
import {
  getSupporterExportProject,
  getSupporterExportChunk,
} from "@/lib/db/queries/projects";
import { getProjectAccess } from "@/lib/project-access";
import { GET } from "@/app/api/projects/[id]/supporters/export/route";
const request = () =>
  GET(new Request("https://example.com/api/projects/p1/supporters/export"), {
    params: Promise.resolve({ id: "p1" }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never);
  vi.mocked(getSupporterExportProject).mockResolvedValue({
    id: "p1",
    name: "Garden",
  } as never);
  vi.mocked(getProjectAccess).mockResolvedValue({ canManage: true } as never);
});
describe("supporter CSV export", () => {
  it("includes all chunks and escapes spreadsheet formulas", async () => {
    const row = {
      participantId: "r1",
      name: '=HYPERLINK("https://example.com")',
      email: "+member@example.com",
      createdAt: new Date("2024-06-01T00:00:00Z"),
    };
    vi.mocked(getSupporterExportChunk)
      .mockResolvedValueOnce(
        Array.from({ length: 500 }, (_, i) => ({
          ...row,
          participantId: `r${i}`,
        })),
      )
      .mockResolvedValueOnce([
        { ...row, participantId: "last", email: "last@example.com" },
      ]);
    const response = await request();
    const csv = await response.text();
    expect(csv.trim().split("\n")).toHaveLength(502);
    expect(csv).toContain("last@example.com");
    expect(csv).toContain(
      '"\'=HYPERLINK(""https://example.com"")",\'+member@example.com',
    );
    expect(getSupporterExportChunk).toHaveBeenNthCalledWith(2, "p1", "r499");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it.each([
    [null, 401],
    [{ user: { id: "u1" } }, 403],
  ])("rejects callers without management access", async (session, status) => {
    vi.mocked(auth).mockResolvedValue(session as never);
    vi.mocked(getProjectAccess).mockResolvedValue({
      canManage: false,
    } as never);
    expect((await request()).status).toBe(status);
    expect(getSupporterExportChunk).not.toHaveBeenCalled();
  });
});
