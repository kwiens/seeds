import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { UpdateForm } from "@/components/forms/update-form";
import { getProjectById } from "@/lib/db/queries/projects";

export const metadata: Metadata = {
  title: "New Update | Seeds",
};

export default async function NewUpdatePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const seed = await getProjectById(params.id);
  if (!seed) notFound();

  if (!(await canManageProject(session, seed))) {
    redirect(`/seeds/${seed.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Update</h1>
        <p className="text-muted-foreground mt-1">
          Share progress on {seed.name}.
        </p>
      </div>
      <UpdateForm seedId={seed.id} />
    </div>
  );
}
