import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminCommentsTable } from "@/components/admin/admin-comments-table";
import { AdminEmailList } from "@/components/admin/admin-email-list";
import { ExportButtons } from "@/components/admin/export-buttons";
import { HomepagePhaseToggle } from "@/components/admin/homepage-phase-toggle";
import { AdminSeedTable } from "@/components/admin/seed-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllComments } from "@/lib/db/queries/comments";
import {
  getAdminEmails,
  getAllSeeds,
  getSupporterEmailsMap,
} from "@/lib/db/queries/admin";
import { getHomepagePhase } from "@/lib/db/queries/settings";

export const metadata: Metadata = {
  title: "Admin | Seeds",
};

const envEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  const [
    allSeeds,
    supporterEmailsMap,
    adminEmails,
    allComments,
    homepagePhase,
  ] = await Promise.all([
    getAllSeeds(),
    getSupporterEmailsMap(),
    getAdminEmails(),
    getAllComments(),
    getHomepagePhase(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage community seed proposals
        </p>
      </div>

      <Tabs defaultValue="seeds">
        <TabsList>
          <TabsTrigger value="seeds">Seeds</TabsTrigger>
          <TabsTrigger value="insights">Comments</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="seeds">
          <AdminSeedTable
            seeds={allSeeds}
            supporterEmailsMap={Object.fromEntries(supporterEmailsMap)}
          />
        </TabsContent>

        <TabsContent value="insights">
          <div className="mt-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Community Insights</h2>
              <p className="text-muted-foreground text-sm">
                View and moderate insights across all seeds.
              </p>
            </div>
            <AdminCommentsTable comments={allComments} />
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="mt-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Export Data</h2>
              <p className="text-muted-foreground text-sm">
                Download seed data as CSV files.
              </p>
            </div>
            <ExportButtons />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="mt-4 space-y-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Homepage Phase</h2>
                <p className="text-muted-foreground text-sm">
                  Switch the homepage between Seed Gathering (Phase 1) and Seed
                  Nurturing (Phase 2) layouts.
                </p>
              </div>
              <HomepagePhaseToggle currentPhase={homepagePhase} />
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Admin Emails</h2>
                <p className="text-muted-foreground text-sm">
                  Manage who has admin access. Emails added here will
                  auto-promote users on their next sign-in.
                </p>
              </div>
              <AdminEmailList dbEmails={adminEmails} envEmails={envEmails} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
