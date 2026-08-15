import type { Metadata } from "next";
import { SeedForm } from "@/components/forms/seed-form";
import { getManagedProjectWorkspace } from "@/lib/project-workspace";

export const metadata: Metadata = {
  title: "Edit Project | Seeds",
};

export default async function EditProjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { project } = await getManagedProjectWorkspace(id);

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Edit project</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Every public project field remains editable as this project matures.
        </p>
      </div>
      <SeedForm project={project} />
    </section>
  );
}
