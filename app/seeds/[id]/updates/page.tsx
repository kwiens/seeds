import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteUpdateButton } from "@/components/seeds/update-actions";
import { getUpdatesBySeed } from "@/lib/db/queries/updates";
import { getSeedById } from "@/lib/db/queries/seeds";

export const metadata: Metadata = {
  title: "Manage Updates | Seeds",
};

export default async function ManageUpdatesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const seed = await getSeedById(params.id);
  if (!seed) notFound();

  if (!canEditSeed(session, seed)) {
    redirect(`/seeds/${seed.id}`);
  }

  const updates = await getUpdatesBySeed(seed.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={`/seeds/${seed.id}`}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-3.5" />
        Back to {seed.name}
      </Link>

      <div className="mt-4 mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Updates</h1>
        <Button asChild>
          <Link href={`/seeds/${seed.id}/updates/new`}>
            <Plus className="mr-1.5 size-4" />
            New Update
          </Link>
        </Button>
      </div>

      {updates.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No updates yet. Post your first update to share progress with
          supporters.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.map((update) => (
                <TableRow key={update.id}>
                  <TableCell>
                    <Link
                      href={`/seeds/${seed.id}/updates/${update.id}`}
                      className="font-medium hover:underline"
                    >
                      {update.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {update.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/seeds/${seed.id}/updates/${update.id}/edit`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <DeleteUpdateButton updateId={update.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
