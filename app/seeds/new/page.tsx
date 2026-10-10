import type { Metadata } from "next";
import { auth } from "@/auth";
import { siteConfig } from "@/config/site";
import { ProjectForm } from "@/components/forms/project-form";

export const metadata: Metadata = {
  title: "Plant a Seed",
  description: `Submit a community project proposal for ${siteConfig.city.name}.`,
};

export default async function NewProjectPage() {
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
      <ProjectForm planterName={session?.user?.name ?? undefined} />
    </div>
  );
}
