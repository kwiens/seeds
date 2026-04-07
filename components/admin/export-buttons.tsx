"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportContributorsCsv,
  exportSeedsCsv,
  exportSupportersCsv,
} from "@/lib/actions/export";

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons() {
  const [isPending, startTransition] = useTransition();

  function handleExport(exportFn: () => Promise<string>, filename: string) {
    startTransition(async () => {
      try {
        const csv = await exportFn();
        downloadCsv(csv, filename);
      } catch {
        toast.error("Export failed. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => handleExport(exportSeedsCsv, "seeds.csv")}
      >
        <Download className="mr-2 h-4 w-4" />
        Download Seeds
      </Button>
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() =>
          handleExport(exportContributorsCsv, "seed-contributors.csv")
        }
      >
        <Download className="mr-2 h-4 w-4" />
        Download Contributors
      </Button>
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => handleExport(exportSupportersCsv, "seed-supporters.csv")}
      >
        <Download className="mr-2 h-4 w-4" />
        Download Supporters
      </Button>
    </div>
  );
}
