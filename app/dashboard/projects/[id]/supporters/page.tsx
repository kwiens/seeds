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
import { getProjectSupporters } from "@/lib/db/queries/projects";
import { getManagedProjectWorkspace } from "@/lib/project-workspace";

export const metadata: Metadata = {
  title: "Project Supporters | Seeds",
};

export default async function ProjectSupportersPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { project } = await getManagedProjectWorkspace(id);

  const supporters = await getProjectSupporters(project.id, {
    includeEmail: true,
  });

  return (
    <section>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Supporters</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {supporters.length} {supporters.length === 1 ? "person" : "people"}{" "}
            supporting this project.
          </p>
        </div>
        {supporters.length > 0 && (
          <SupporterExport supporters={supporters} seedName={project.name} />
        )}
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
                  <TableCell className="font-medium">
                    {supporter.name}
                  </TableCell>
                  <TableCell>{supporter.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(supporter.createdAt).toLocaleDateString("en-US")}
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
