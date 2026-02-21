import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { SeedForm } from "@/components/forms/seed-form";
import { getSeedById } from "@/lib/db/queries/seeds";

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

  const seed = await getSeedById(params.id);
  if (!seed) notFound();

  if (!canEditSeed(session, seed)) {
    redirect(`/seeds/${seed.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Seed</h1>
        <p className="text-muted-foreground mt-1">
          Update your community project proposal.
        </p>
      </div>
      <SeedForm seed={seed} />
    </div>
  );
}
