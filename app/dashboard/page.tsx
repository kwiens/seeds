import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import {
  getProjectsCreatedByUser,
  getSupportedProjectsByUser,
} from "@/lib/db/queries/projects";
import { getMyProjects } from "@/lib/db/queries/my-projects";
import type { DashboardTab } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "My Projects | Seeds",
};

const dashboardTabs: DashboardTab[] = ["my-sprouts", "my-seeds", "supporting"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const [{ tab }, sprouts, userSeeds, supportedSeeds] = await Promise.all([
    searchParams,
    getMyProjects(session.user.id, session.user.role),
    getProjectsCreatedByUser(session.user.id),
    getSupportedProjectsByUser(session.user.id),
  ]);
  const initialTab = dashboardTabs.includes(tab as DashboardTab)
    ? (tab as DashboardTab)
    : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground mt-1">
            Grow your projects and follow the ideas you support.
          </p>
        </div>
        <Button asChild>
          <Link href="/seeds/new" className="gap-1.5">
            <Plus className="size-4" />
            Plant a Seed
          </Link>
        </Button>
      </div>

      <DashboardContent
        sprouts={sprouts}
        userSeeds={userSeeds}
        supportedSeeds={supportedSeeds}
        initialTab={initialTab}
      />
    </div>
  );
}
