import type { Metadata } from "next";
import { UpdateForm } from "@/components/forms/update-form";
import { getManagedProjectWorkspace } from "@/lib/project-workspace";

export const metadata: Metadata = {
  title: "New Public Update | Seeds",
};

export default async function NewProjectUpdatePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { project } = await getManagedProjectWorkspace(id);

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">New public update</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Share progress on {project.name}.
        </p>
      </div>
      <UpdateForm seedId={project.id} />
    </section>
  );
}
