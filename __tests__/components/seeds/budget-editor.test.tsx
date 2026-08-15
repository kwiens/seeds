import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { BudgetEditor } from "@/components/seeds/budget-editor";
import { saveBudget } from "@/lib/actions/budgets";
import type { Budget } from "@/lib/db/types";

vi.mock("@/lib/actions/budgets", () => ({
  saveBudget: vi.fn().mockResolvedValue({ success: true }),
}));

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "budget-1",
    projectId: "seed-1",
    status: "proposed",
    lineItems: [],
    notes: null,
    isPublic: false,
    updatedBy: "user-1",
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

const proposedBudget = makeBudget({
  lineItems: [
    { label: "Seed packets", amount: 1250 },
    { label: "Soil delivery", amount: 499.5 },
  ],
  notes: "Quotes from two vendors",
});

function renderEditor({
  proposed = null,
  final = null,
  canManage = true,
}: {
  proposed?: Budget | null;
  final?: Budget | null;
  canManage?: boolean;
} = {}) {
  return render(
    <BudgetEditor
      seedId="seed-1"
      seedName="Garden Party!"
      proposed={proposed}
      final={final}
      canManage={canManage}
    />,
  );
}

function accordionTrigger() {
  return screen.getByRole("button", { name: /budget/i, expanded: false });
}

function openAccordion() {
  fireEvent.click(accordionTrigger());
}

function selectFinalTab() {
  const tab = screen.getByRole("tab", { name: "Final" });
  // Radix Tabs activate on mousedown; click keeps parity with real browsers.
  fireEvent.mouseDown(tab);
  fireEvent.click(tab);
}

afterEach(() => {
  vi.mocked(saveBudget).mockClear();
  vi.mocked(saveBudget).mockResolvedValue({ success: true });
  vi.restoreAllMocks();
});

describe("BudgetEditor header summary", () => {
  it("shows Not started when neither budget exists", () => {
    renderEditor();

    expect(accordionTrigger()).toHaveTextContent("Not started");
  });

  it("shows only the proposed total, rounded to whole dollars", () => {
    renderEditor({ proposed: proposedBudget });

    const trigger = accordionTrigger();
    // 1250 + 499.5 = 1749.5, formatted with maximumFractionDigits: 0
    expect(trigger).toHaveTextContent("Proposed $1,750");
    expect(trigger).not.toHaveTextContent("Final");
    expect(trigger).not.toHaveTextContent("Not started");
  });

  it("shows both totals separated by a dot when both budgets exist", () => {
    renderEditor({
      proposed: proposedBudget,
      final: makeBudget({
        status: "final",
        lineItems: [{ label: "Everything", amount: 2000 }],
      }),
    });

    expect(accordionTrigger()).toHaveTextContent(
      "Proposed $1,750 · Final $2,000",
    );
  });
});

describe("BudgetEditor proposed stage", () => {
  it("renders existing line items, notes, and the computed total", () => {
    renderEditor({ proposed: proposedBudget });
    openAccordion();

    expect(
      screen.getByText("What this Sprout expects to spend."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Line item 1 description")).toHaveValue(
      "Seed packets",
    );
    expect(screen.getByLabelText("Line item 1 amount")).toHaveValue(1250);
    expect(screen.getByLabelText("Line item 2 description")).toHaveValue(
      "Soil delivery",
    );
    expect(screen.getByLabelText("Line item 2 amount")).toHaveValue(499.5);
    expect(screen.getByLabelText("Notes")).toHaveValue(
      "Quotes from two vendors",
    );
    // The header summary shows $1,750 too, so scope to the tab panel.
    expect(
      within(screen.getByRole("tabpanel")).getByText("$1,750"),
    ).toBeInTheDocument();
  });

  it("renders a $0 empty state with no line item rows", () => {
    renderEditor();
    openAccordion();

    expect(screen.queryByLabelText(/line item 1/i)).not.toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("hides editing controls and disables fields without manage permission", () => {
    renderEditor({ proposed: proposedBudget, canManage: false });
    openAccordion();

    expect(screen.getByLabelText("Line item 1 description")).toBeDisabled();
    expect(screen.getByLabelText("Line item 1 amount")).toBeDisabled();
    expect(screen.getByLabelText("Notes")).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /add line item/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove line item/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save proposed budget/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    // Read-only viewers can still export
    expect(
      screen.getByRole("button", { name: /export csv/i }),
    ).toBeInTheDocument();
  });

  it("adds a line item and updates the total as amounts change", () => {
    renderEditor();
    openAccordion();

    fireEvent.click(screen.getByRole("button", { name: /add line item/i }));

    const amount = screen.getByLabelText("Line item 1 amount");
    expect(amount).toHaveValue(null); // zero renders as an empty input

    fireEvent.change(screen.getByLabelText("Line item 1 description"), {
      target: { value: "Mulch" },
    });
    fireEvent.change(amount, { target: { value: "250.75" } });

    expect(screen.getByText("$251")).toBeInTheDocument();
  });

  it("treats a cleared amount as zero", () => {
    renderEditor({ proposed: proposedBudget });
    openAccordion();

    fireEvent.change(screen.getByLabelText("Line item 1 amount"), {
      target: { value: "" },
    });

    // 0 + 499.5 rounds to $500
    expect(screen.getByText("$500")).toBeInTheDocument();
  });

  it("removes a line item and recomputes the total", () => {
    renderEditor({ proposed: proposedBudget });
    openAccordion();

    fireEvent.click(screen.getByRole("button", { name: "Remove line item 1" }));

    expect(screen.getByLabelText("Line item 1 description")).toHaveValue(
      "Soil delivery",
    );
    expect(screen.queryByLabelText("Line item 2 description")).toBeNull();
    expect(screen.getByText("$500")).toBeInTheDocument();
  });

  it("saves edited state with the correct action arguments", async () => {
    renderEditor({ proposed: proposedBudget });
    openAccordion();

    fireEvent.change(screen.getByLabelText("Line item 1 amount"), {
      target: { value: "1300" },
    });
    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "Updated quote" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /save proposed budget/i }),
    );

    await waitFor(() => expect(saveBudget).toHaveBeenCalledOnce());
    expect(saveBudget).toHaveBeenCalledWith("seed-1", "proposed", {
      lineItems: [
        { label: "Seed packets", amount: 1300 },
        { label: "Soil delivery", amount: 499.5 },
      ],
      notes: "Updated quote",
      isPublic: true,
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Saved");
  });

  it("surfaces an error returned by the save action", async () => {
    vi.mocked(saveBudget).mockResolvedValueOnce({
      error: "Line item needs a label",
    });
    renderEditor({ proposed: proposedBudget });
    openAccordion();

    fireEvent.click(
      screen.getByRole("button", { name: /save proposed budget/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Line item needs a label",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not offer Copy from Proposed on the proposed tab", () => {
    renderEditor({ proposed: proposedBudget });
    openAccordion();

    expect(
      screen.queryByRole("button", { name: /copy from proposed/i }),
    ).not.toBeInTheDocument();
  });
});

describe("BudgetEditor final stage", () => {
  it("saves against the final status", async () => {
    renderEditor({ proposed: proposedBudget });
    openAccordion();
    selectFinalTab();

    fireEvent.click(screen.getByRole("button", { name: /save final budget/i }));

    await waitFor(() => expect(saveBudget).toHaveBeenCalledOnce());
    expect(saveBudget).toHaveBeenCalledWith("seed-1", "final", {
      lineItems: [],
      notes: "",
      isPublic: false,
    });
  });

  it("shows an over-budget diff badge against the proposed total", () => {
    renderEditor({
      proposed: proposedBudget,
      final: makeBudget({
        status: "final",
        lineItems: [{ label: "Everything", amount: 2000 }],
      }),
    });
    openAccordion();
    selectFinalTab();

    // 2000 - 1749.5 = 250.5, shown as +$251 (abs, rounded)
    expect(screen.getByText(/\+\$251 vs Proposed/)).toBeInTheDocument();
  });

  it("shows an under-budget diff badge with a minus sign", () => {
    renderEditor({
      proposed: proposedBudget,
      final: makeBudget({
        status: "final",
        lineItems: [{ label: "Everything", amount: 1549.5 }],
      }),
    });
    openAccordion();
    selectFinalTab();

    expect(screen.getByText(/-\$200 vs Proposed/)).toBeInTheDocument();
  });

  it("hides the diff badge when final matches proposed", () => {
    renderEditor({
      proposed: proposedBudget,
      final: makeBudget({
        status: "final",
        lineItems: [{ label: "Everything", amount: 1749.5 }],
      }),
    });
    openAccordion();
    selectFinalTab();

    expect(screen.queryByText(/vs Proposed/)).not.toBeInTheDocument();
  });

  it("copies proposed line items into an empty final budget without confirming", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    renderEditor({ proposed: proposedBudget });
    openAccordion();
    selectFinalTab();

    fireEvent.click(
      screen.getByRole("button", { name: /copy from proposed/i }),
    );

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Line item 1 description")).toHaveValue(
      "Seed packets",
    );
    expect(screen.getByLabelText("Line item 2 description")).toHaveValue(
      "Soil delivery",
    );
    expect(
      within(screen.getByRole("tabpanel")).getByText("$1,750"),
    ).toBeInTheDocument();
  });

  it("keeps existing final line items when the confirm dialog is declined", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderEditor({
      proposed: proposedBudget,
      final: makeBudget({
        status: "final",
        lineItems: [{ label: "Actual spend", amount: 900 }],
      }),
    });
    openAccordion();
    selectFinalTab();

    fireEvent.click(
      screen.getByRole("button", { name: /copy from proposed/i }),
    );

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Line item 1 description")).toHaveValue(
      "Actual spend",
    );
    expect(screen.queryByLabelText("Line item 2 description")).toBeNull();
  });

  it("replaces existing final line items when the confirm dialog is accepted", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderEditor({
      proposed: proposedBudget,
      final: makeBudget({
        status: "final",
        lineItems: [{ label: "Actual spend", amount: 900 }],
      }),
    });
    openAccordion();
    selectFinalTab();

    fireEvent.click(
      screen.getByRole("button", { name: /copy from proposed/i }),
    );

    expect(screen.getByLabelText("Line item 1 description")).toHaveValue(
      "Seed packets",
    );
    expect(screen.getByLabelText("Line item 2 description")).toHaveValue(
      "Soil delivery",
    );
  });

  it("hides Copy from Proposed when there is no proposed budget", () => {
    renderEditor();
    openAccordion();
    selectFinalTab();

    expect(
      screen.queryByRole("button", { name: /copy from proposed/i }),
    ).not.toBeInTheDocument();
  });

  it("hides Copy from Proposed without manage permission", () => {
    renderEditor({ proposed: proposedBudget, canManage: false });
    openAccordion();
    selectFinalTab();

    expect(
      screen.queryByRole("button", { name: /copy from proposed/i }),
    ).not.toBeInTheDocument();
  });
});

describe("BudgetEditor CSV export", () => {
  it("downloads an escaped CSV named after the seed and stage", async () => {
    let capturedBlob: Blob | null = null;
    let downloadName = "";
    vi.stubGlobal(
      "URL",
      Object.assign(Object.create(URL), {
        createObjectURL: vi.fn((blob: Blob) => {
          capturedBlob = blob;
          return "blob:mock";
        }),
        revokeObjectURL: vi.fn(),
      }),
    );
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download;
    });

    renderEditor({
      proposed: makeBudget({
        lineItems: [
          { label: "=SUM(A1:A2)", amount: 100 },
          { label: 'Soil, "premium"', amount: 250 },
        ],
        notes: "Vendor quote pending",
      }),
    });
    openAccordion();
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    expect(downloadName).toBe("garden-party-proposed-budget.csv");
    expect(capturedBlob).not.toBeNull();
    const csv = await (capturedBlob as unknown as Blob).text();
    expect(csv.split("\n")).toEqual([
      "Garden Party! — Proposed Budget",
      "",
      "Line item,Amount",
      "'=SUM(A1:A2),100",
      '"Soil, ""premium""",250',
      "Total,350",
      "",
      "Notes,Vendor quote pending",
    ]);
    vi.unstubAllGlobals();
  });
});
