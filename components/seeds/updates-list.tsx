import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhotoGrid } from "@/components/photo-grid";
import type { SeedUpdateWithAuthor } from "@/lib/db/queries/updates";
import { formatDisplayName, formatRelativeTime } from "@/lib/format";
import { extractPlainText } from "@/lib/tiptap";

export function UpdatesList({
  updates,
  seedId,
}: {
  updates: SeedUpdateWithAuthor[];
  seedId: string;
}) {
  return (
    <div className="space-y-6">
      {updates.map((update) => (
        <Link
          key={update.id}
          href={`/seeds/${seedId}/updates/${update.id}`}
          className="hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
        >
          <h3 className="mb-1 font-semibold">{update.title}</h3>
          <div className="mb-2 flex items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={update.authorImage ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {update.authorName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-xs">
              {formatDisplayName(update.authorName)} &middot;{" "}
              {formatRelativeTime(update.createdAt)}
            </span>
          </div>
          {update.photos.length > 0 && (
            <div className="mb-2">
              <PhotoGrid photos={update.photos} alt={update.title} size="sm" />
            </div>
          )}
          <p className="text-muted-foreground line-clamp-3 whitespace-pre-line text-sm">
            {extractPlainText(update.body)}
          </p>
        </Link>
      ))}
    </div>
  );
}
