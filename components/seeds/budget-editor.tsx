"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { saveBudget } from "@/lib/actions/budgets";
import type { Budget } from "@/lib/db/types";
import { cn } from "@/lib/utils";

type LineItem = { label: string; amount: number };

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function csvField(value: string | number): string {
  const raw = String(value);
  // Spreadsheet apps execute cells beginning with these characters as
  // formulas. Prefix user-controlled text so exported budgets stay inert.
  const str =
    typeof value === "string" && /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sprout"
  );
}

function downloadBudgetCsv(
  seedName: string,
  status: "proposed" | "final",
  lineItems: LineItem[],
  notes: string,
  total: number,
) {
  const stageLabel = status === "proposed" ? "Proposed" : "Final";
  const rows = [
    [`${seedName} — ${stageLabel} Budget`],
    [],
    ["Line item", "Amount"],
    ...lineItems.map((item) => [item.label, String(item.amount)]),
    ["Total", String(total)],
  ];
  if (notes.trim()) {
    rows.push([], ["Notes", notes]);
  }

  const csv = rows.map((row) => row.map(csvField).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(seedName)}-${status}-budget.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BudgetEditor({
  seedId,
  seedName,
  proposed,
  final,
  canManage,
}: {
  seedId: string;
  seedName: string;
  proposed: Budget | null;
  final: Budget | null;
  canManage: boolean;
}) {
  const proposedTotal = totalOf(proposed);
  const finalTotal = totalOf(final);

  return (
    <details className="group rounded-lg border p-4">
      <summary className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex-1">Budget</span>
        <span className="text-muted-foreground text-xs font-normal">
          {proposedTotal === null && finalTotal === null ? (
            "Not started"
          ) : (
            <>
              {proposedTotal !== null && (
                <>
                  Proposed{" "}
                  <span className="text-foreground font-bold">
                    {formatCurrency(proposedTotal)}
                  </span>
                </>
              )}
              {proposedTotal !== null && finalTotal !== null && " · "}
              {finalTotal !== null && (
                <>
                  Final{" "}
                  <span className="text-foreground font-bold">
                    {formatCurrency(finalTotal)}
                  </span>
                </>
              )}
            </>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-3">
        <Tabs defaultValue="proposed">
          <TabsList>
            <TabsTrigger value="proposed">Proposed</TabsTrigger>
            <TabsTrigger value="final">Final</TabsTrigger>
          </TabsList>
          <TabsContent value="proposed">
            <BudgetStageEditor
              seedId={seedId}
              seedName={seedName}
              status="proposed"
              budget={proposed}
              compareTotal={null}
              canManage={canManage}
              description="What this Sprout expects to spend."
              emphasize
            />
          </TabsContent>
          <TabsContent value="final">
            <BudgetStageEditor
              seedId={seedId}
              seedName={seedName}
              status="final"
              budget={final}
              compareTotal={proposedTotal}
              canManage={canManage}
              description="What this Sprout actually spent, once wrapped up."
              copyFrom={proposed?.lineItems ?? null}
            />
          </TabsContent>
        </Tabs>
      </div>
    </details>
  );
}

function totalOf(budget: Budget | null): number | null {
  if (!budget || !Array.isArray(budget.lineItems)) return null;
  return budget.lineItems.reduce((sum, item) => sum + item.amount, 0);
}

function BudgetStageEditor({
  seedId,
  seedName,
  status,
  budget,
  compareTotal,
  canManage,
  description,
  copyFrom,
  emphasize,
}: {
  seedId: string;
  seedName: string;
  status: "proposed" | "final";
  budget: Budget | null;
  compareTotal: number | null;
  canManage: boolean;
  description: string;
  copyFrom?: LineItem[] | null;
  emphasize?: boolean;
}) {
  const [lineItems, setLineItems] = useState<LineItem[]>(
    budget?.lineItems ?? [],
  );
  const [notes, setNotes] = useState(budget?.notes ?? "");
  const [isPublic, setIsPublic] = useState(budget?.isPublic ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const total = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const diff = compareTotal === null ? null : total - compareTotal;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setLineItems((items) =>
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  function addItem() {
    setLineItems((items) => [...items, { label: "", amount: 0 }]);
  }

  function copyFromProposed() {
    if (!copyFrom || copyFrom.length === 0) return;
    if (
      lineItems.length > 0 &&
      !window.confirm(
        "Replace the current Final Budget line items with a copy of Proposed?",
      )
    ) {
      return;
    }
    setLineItems(copyFrom.map((item) => ({ ...item })));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveBudget(seedId, status, {
        lineItems,
        notes,
        isPublic,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">{description}</p>
        {canManage && copyFrom && copyFrom.length > 0 && (
          <button
            type="button"
            onClick={copyFromProposed}
            className="text-primary -mx-2 -my-2 shrink-0 px-2 py-2 text-xs font-medium hover:underline"
          >
            Copy from Proposed
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-2 py-1.5 text-xs"
        >
          {error}
        </p>
      )}

      <div className="space-y-2">
        {lineItems.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <Textarea
              value={item.label}
              placeholder="Line item"
              disabled={!canManage}
              onChange={(e) => updateItem(index, { label: e.target.value })}
              rows={1}
              aria-label={`Line item ${index + 1} description`}
              className="min-h-9 flex-1 resize-none py-2"
            />
            <Input
              type="number"
              min={0}
              inputMode="decimal"
              value={item.amount === 0 ? "" : item.amount}
              placeholder="0"
              disabled={!canManage}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                updateItem(index, { amount: parseFloat(e.target.value) || 0 })
              }
              aria-label={`Line item ${index + 1} amount`}
              className="h-9 w-20 shrink-0 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                aria-label={`Remove line item ${index + 1}`}
                className="shrink-0"
              >
                <Trash2 className="text-muted-foreground size-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <button
          type="button"
          onClick={addItem}
          className="text-muted-foreground hover:border-primary hover:text-foreground w-full rounded-md border border-dashed px-3 py-2 text-left text-sm"
        >
          <Plus className="mr-1.5 inline size-3.5" />
          Add line item
        </button>
      )}

      <div className="flex items-baseline justify-between gap-2 border-t pt-3">
        <button
          type="button"
          onClick={() =>
            downloadBudgetCsv(seedName, status, lineItems, notes, total)
          }
          className="text-muted-foreground hover:text-foreground -mx-2 -my-2 inline-flex items-center gap-1 px-2 py-2 text-xs font-medium"
        >
          <Download className="size-3" />
          Export CSV
        </button>
        <div className="flex items-baseline gap-2">
          {diff !== null && diff !== 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {diff > 0 ? "+" : "-"}
              {formatCurrency(Math.abs(diff))} vs Proposed
            </span>
          )}
          <span className="text-muted-foreground text-xs">Total</span>
          <span
            className={cn("font-extrabold", emphasize ? "text-2xl" : "text-lg")}
          >
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {canManage && (
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          Show this detailed budget on the public project page
        </label>
      )}

      <div>
        <label
          htmlFor={`budget-notes-${status}`}
          className="mb-1.5 block text-xs font-semibold"
        >
          Notes
        </label>
        <Textarea
          id={`budget-notes-${status}`}
          value={notes}
          disabled={!canManage}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. in-kind donations, funding uncertainty, cost changes..."
          className="min-h-16"
        />
      </div>

      {canManage && (
        <div className="flex items-center justify-end gap-2">
          {saved && (
            <span role="status" className="text-muted-foreground text-xs">
              Saved
            </span>
          )}
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            Save {status === "proposed" ? "Proposed" : "Final"} Budget
          </Button>
        </div>
      )}
    </div>
  );
}
