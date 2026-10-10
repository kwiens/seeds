import { redirect } from "next/navigation";
import { Pagination } from "@/components/projects/pagination";
import type { Metadata } from "next";
import { SupporterExport } from "@/components/dashboard/supporter-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getProjectSupporters,
  getProjectSupportCount,
  SUPPORTERS_PER_PAGE,
} from "@/lib/db/queries/projects";
import { getManagedProjectWorkspace } from "@/lib/project-workspace";

export const metadata: Metadata = {
  title: "Project Supporters",
};

export default async function ProjectSupportersPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await props.params;
  const { project } = await getManagedProjectWorkspace(id);

  const { page: rawPage } = await props.searchParams;
  const requestedPage = Number(rawPage);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const totalCount = await getProjectSupportCount(project.id);
  const totalPages = Math.ceil(totalCount / SUPPORTERS_PER_PAGE);
  if (page > Math.max(1, totalPages)) {
    redirect(
      `/dashboard/projects/${project.id}/supporters${totalPages > 1 ? `?page=${totalPages}` : ""}`,
    );
  }
  const supporters = await getProjectSupporters(project.id, {
    includeEmail: true,
    page,
  });

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Supporters</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalCount} {totalCount === 1 ? "person" : "people"} supporting
            this project.
          </p>
        </div>
        {totalCount > 0 && <SupporterExport projectId={project.id} />}
      </div>

      {supporters.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            No one has supported this project yet. Share its public page to
            gather sunlight.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Supported On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supporters.map((supporter) => (
                <TableRow key={supporter.id}>
                  <TableCell className="font-medium whitespace-normal break-words">
                    {supporter.name}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    {supporter.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(supporter.createdAt).toLocaleDateString("en-US")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} />
    </section>
  );
}
