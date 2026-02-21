import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { SeedForm } from "@/components/forms/seed-form";
import { RegenerateImageButton } from "@/components/seeds/regenerate-image-button";
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

  if (seed.createdBy !== session.user.id && session.user.role !== "admin") {
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

      {/* Image section */}
      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-medium">Illustration</h2>
        {seed.imageUrl ? (
          <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-lg">
            <Image
              src={seed.imageUrl}
              alt={seed.name}
              fill
              className="object-cover"
              sizes="320px"
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No image generated yet.
          </p>
        )}
        <RegenerateImageButton seedId={seed.id} hasImage={!!seed.imageUrl} />
      </div>

      <SeedForm seed={seed} />
    </div>
  );
}
