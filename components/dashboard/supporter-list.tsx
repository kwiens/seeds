"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Supporter {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function SupporterExport({
  supporters,
  seedName,
}: {
  supporters: Supporter[];
  seedName: string;
}) {
  function downloadCsv() {
    const header = "Name,Email,Supported On";
    const rows = supporters.map(
      (s) =>
        `"${s.name.replace(/"/g, '""')}","${s.email}","${new Date(s.createdAt).toISOString()}"`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${seedName.replace(/[^a-z0-9]/gi, "-")}-supporters.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={downloadCsv}>
      <Download className="mr-1.5 size-3.5" />
      Export CSV
    </Button>
  );
}
