import Link from "next/link";
import type { Metadata } from "next";
import { Pencil, Plus } from "lucide-react";
import { DeleteUpdateButton } from "@/components/seeds/update-actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPublicProjectUpdates } from "@/lib/db/queries/project-updates";
import { getManagedProjectWorkspace } from "@/lib/project-workspace";
import { projectWorkspacePath } from "@/lib/project-workspace-navigation";

export const metadata: Metadata = {
  title: "Public Updates | Seeds",
};

export default async function ProjectUpdatesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { project } = await getManagedProjectWorkspace(id);

  const updates = await getPublicProjectUpdates(project.id);
  const updatesPath = projectWorkspacePath(project.id, "updates");

  return (
    <section>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Public updates</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Share progress on the public project page.
          </p>
        </div>
        <Button asChild>
          <Link href={`${updatesPath}/new`}>
            <Plus className="mr-1.5 size-4" />
            New Update
          </Link>
        </Button>
      </div>

      {updates.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No updates yet. Post your first update to keep supporters in the
            loop.
          </p>
        </div>
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
                  <TableCell className="whitespace-normal break-words">
                    <Link
                      href={`/seeds/${project.id}/updates/${update.id}`}
                      className="font-medium hover:underline"
                    >
                      {update.title ?? "Update"}
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
                        <Link href={`${updatesPath}/${update.id}/edit`}>
                          <Pencil className="size-4" />
                          <span className="sr-only">
                            Edit {update.title ?? "update"}
                          </span>
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
    </section>
  );
}
