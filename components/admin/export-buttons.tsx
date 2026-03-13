"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportContributorsCsv,
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
      const csv = await exportFn();
      downloadCsv(csv, filename);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
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
