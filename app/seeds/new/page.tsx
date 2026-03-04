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
          Share your idea to improve the quality of life and access to nature in
          your community. Build your team, create a plan and get support from
          other passionate people!
        </p>
      </div>
      <SeedForm planterName={session?.user?.name ?? undefined} />
    </div>
  );
}
