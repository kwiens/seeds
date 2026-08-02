import { ChevronDown, FileText } from "lucide-react";
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
    <details className="group rounded-lg border p-4">
      <summary className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex-1">Files</span>
        <span className="text-muted-foreground text-xs font-normal">
          {documents.length === 0
            ? "None yet"
            : `${documents.length} file${documents.length === 1 ? "" : "s"}`}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-3">
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Files shared in Team Updates show up here automatically.
          </p>
        ) : (
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li key={`${doc.updateId}-${doc.attachmentIndex}`}>
                <a
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
