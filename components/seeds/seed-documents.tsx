import { FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ProjectDocument } from "@/lib/db/queries/documents";
import { formatRelativeTime } from "@/lib/format";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SeedDocuments({
  seedId,
  documents,
}: {
  seedId: string;
  documents: ProjectDocument[];
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value="files"
        className="rounded-lg border px-4 last:border-b"
      >
        <AccordionTrigger className="hover:no-underline">
          <span className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-2">
            <span>Files</span>
            <span className="text-muted-foreground text-right text-xs font-normal">
              {documents.length === 0
                ? "None yet"
                : `${documents.length} file${documents.length === 1 ? "" : "s"}`}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Files shared in Team Updates show up here automatically.
            </p>
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <a
                  key={`${doc.updateId}-${doc.attachmentIndex}`}
                  href={`/dashboard/projects/${seedId}/team#update-${doc.updateId}`}
                  className="hover:bg-accent flex items-center gap-2 rounded-md p-1.5"
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {doc.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {doc.posterName} · {formatRelativeTime(doc.createdAt)} ·{" "}
                      {formatSize(doc.size)}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
