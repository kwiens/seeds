import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { SeedForm } from "@/components/forms/seed-form";
import { getProjectById } from "@/lib/db/queries/projects";

export const metadata: Metadata = {
  title: "Edit Seed | Seeds",
};

export default async function EditSeedPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const project = await getProjectById(params.id);
  if (!project) notFound();

  if (!(await canManageProject(session, project))) {
    redirect(`/seeds/${project.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Seed</h1>
        <p className="text-muted-foreground mt-1">
          Update your community project proposal.
        </p>
      </div>
      <SeedForm project={project} />
    </div>
  );
}
