import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { UpdateForm } from "@/components/forms/update-form";
import { getPublicProjectUpdateById } from "@/lib/db/queries/project-updates";
import { getProjectById } from "@/lib/db/queries/projects";
import { EMPTY_TIPTAP_DOC, parseTiptapDoc } from "@/lib/tiptap";

export const metadata: Metadata = {
  title: "Edit Update | Seeds",
};

export default async function EditUpdatePage(props: {
  params: Promise<{ id: string; updateId: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const [seed, update] = await Promise.all([
    getProjectById(params.id),
    getPublicProjectUpdateById(params.updateId),
  ]);
  if (!seed) notFound();
  if (!update || update.projectId !== seed.id) notFound();

  if (!(await canManageProject(session, seed))) {
    redirect(`/seeds/${seed.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Update</h1>
        <p className="text-muted-foreground mt-1">
          Editing update for {seed.name}.
        </p>
      </div>
      <UpdateForm
        seedId={seed.id}
        update={{
          id: update.id,
          title: update.title ?? "",
          body: parseTiptapDoc(update.body) ?? EMPTY_TIPTAP_DOC,
          photos: update.photos,
        }}
      />
    </div>
  );
}
