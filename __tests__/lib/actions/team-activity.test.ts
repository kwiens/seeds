import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockDbInsertOnConflictChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markSproutActivityRead } from "@/lib/actions/team-activity";

describe("markSproutActivityRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when signed out", async () => {
    setAuthMock(auth, null);

    await markSproutActivityRead("seed-1");

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("upserts the read marker and revalidates", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    const chain = mockDbInsertOnConflictChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await markSproutActivityRead("seed-1");

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ seedId: "seed-1", userId: "user-1" }),
    );
    expect(chain._onConflictDoUpdate).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/sprouts");
  });
});
