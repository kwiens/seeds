import type { Metadata } from "next";
import { auth } from "@/auth";
import { SeedForm } from "@/components/forms/seed-form";

export const metadata: Metadata = {
  title: "Plant a Seed | Seeds",
  description: "Submit a community project proposal for Chattanooga.",
};

export default async function NewSeedPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Plant a Seed</h1>
        <p className="text-muted-foreground mt-1">
          Share your idea to help our region grow. Every great project starts as
          a seed.
        </p>
      </div>
      <SeedForm planterName={session?.user?.name ?? undefined} />
    </div>
  );
}
