import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUpdateById } from "@/lib/db/queries/updates";
import { getSeedById } from "@/lib/db/queries/seeds";
import { formatDisplayName } from "@/lib/format";
import { PhotoGrid } from "@/components/photo-grid";
import { renderTiptapHTML, extractPlainText } from "@/lib/tiptap";

export async function generateMetadata(props: {
  params: Promise<{ id: string; updateId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const update = await getUpdateById(params.updateId);
  if (!update) return { title: "Update Not Found" };
  return {
    title: `${update.title} | Seeds`,
    description: extractPlainText(update.body).slice(0, 160),
  };
}

export default async function UpdatePage(props: {
  params: Promise<{ id: string; updateId: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  const seed = await getSeedById(params.id);
  if (!seed) notFound();

  const update = await getUpdateById(params.updateId);
  if (!update || update.seedId !== seed.id) notFound();

  const canEdit = canEditSeed(session, seed);
  const wasEdited =
    update.updatedAt.getTime() - update.createdAt.getTime() > 1000;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/seeds/${seed.id}`}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-3.5" />
        Back to {seed.name}
      </Link>

      <article className="mt-4">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{update.title}</h1>
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/seeds/${seed.id}/updates/${update.id}/edit`}>
                <Pencil className="mr-1.5 size-3.5" />
                Edit
              </Link>
            </Button>
          )}
        </div>

        <div className="mb-8 flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={update.authorImage ?? undefined} />
            <AvatarFallback>{update.authorName[0]}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <span className="font-medium">
              {formatDisplayName(update.authorName)}
            </span>
            <span className="text-muted-foreground ml-2">
              {update.createdAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {wasEdited && " (edited)"}
            </span>
          </div>
        </div>

        {update.photos.length > 0 && (
          <div className="mb-8">
            <PhotoGrid photos={update.photos} alt={update.title} />
          </div>
        )}

        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderTiptapHTML(update.body) }}
        />
      </article>
    </div>
  );
}
