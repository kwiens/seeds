import type { Metadata } from "next";
import { SeedForm } from "@/components/forms/seed-form";

export const metadata: Metadata = {
  title: "Plant a Seed | Seeds",
  description: "Submit a community project proposal for Chattanooga.",
};

export default function NewSeedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Plant a Seed</h1>
        <p className="text-muted-foreground mt-1">
          Share your idea to help Chattanooga grow. Every great project starts as
          a seed.
        </p>
      </div>
      <SeedForm />
    </div>
  );
}
