import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UpdateForm } from "@/components/forms/update-form";
import { getPublicProjectUpdateById } from "@/lib/db/queries/project-updates";
import { getManagedProjectWorkspace } from "@/lib/project-workspace";
import { EMPTY_TIPTAP_DOC, parseTiptapDoc } from "@/lib/tiptap";

export const metadata: Metadata = {
  title: "Edit Public Update | Seeds",
};

export default async function EditProjectUpdatePage(props: {
  params: Promise<{ id: string; updateId: string }>;
}) {
  const { id, updateId } = await props.params;
  const [{ project }, update] = await Promise.all([
    getManagedProjectWorkspace(id),
    getPublicProjectUpdateById(updateId),
  ]);

  if (!update || update.projectId !== project.id) notFound();

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">
          Edit public update
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Update what supporters see on {project.name}.
        </p>
      </div>
      <UpdateForm
        seedId={project.id}
        update={{
          id: update.id,
          title: update.title ?? "",
          body: parseTiptapDoc(update.body) ?? EMPTY_TIPTAP_DOC,
          photos: update.photos,
        }}
      />
    </section>
  );
}
