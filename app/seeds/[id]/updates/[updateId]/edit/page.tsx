import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { UpdateForm } from "@/components/forms/update-form";
import { getUpdateById } from "@/lib/db/queries/updates";
import { getSeedById } from "@/lib/db/queries/seeds";

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

  const seed = await getSeedById(params.id);
  if (!seed) notFound();

  if (!canEditSeed(session, seed)) {
    redirect(`/seeds/${seed.id}`);
  }

  const update = await getUpdateById(params.updateId);
  if (!update || update.seedId !== seed.id) notFound();

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
          title: update.title,
          body: update.body as import("@tiptap/react").JSONContent,
          photos: update.photos,
        }}
      />
    </div>
  );
}
