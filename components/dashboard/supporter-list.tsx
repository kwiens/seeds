import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SupporterExport({ projectId }: { projectId: string }) {
  return (
    <Button variant="outline" size="sm" className="h-11 sm:h-8" asChild>
      <a href={`/api/projects/${projectId}/supporters/export`}>
        <Download className="mr-1.5 size-3.5" aria-hidden="true" />
        Export CSV
      </a>
    </Button>
  );
}
