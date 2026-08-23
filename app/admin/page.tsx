import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminCommentsTable } from "@/components/admin/admin-comments-table";
import { AdminEmailList } from "@/components/admin/admin-email-list";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { BannerSettings } from "@/components/admin/banner-settings";
import { CouncilList } from "@/components/admin/council-list";
import { ExportButtons } from "@/components/admin/export-buttons";
import { HomepagePhaseToggle } from "@/components/admin/homepage-phase-toggle";
import { AdminSeedTable } from "@/components/admin/seed-data-table";
import { UserList } from "@/components/admin/user-list";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type AdminTab, isAdminTab } from "@/lib/admin-tabs";
import { getAllComments } from "@/lib/db/queries/comments";
import {
  getAdminEmails,
  getAllProjects,
  getCouncilMembers,
  getSupporterEmailsMap,
  getUsersPage,
  USERS_PER_PAGE,
} from "@/lib/db/queries/admin";
import { getBannerConfig, getHomepagePhase } from "@/lib/db/queries/settings";

export const metadata: Metadata = {
  title: "Admin | Seeds",
};

const envEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tab?: string;
  }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const activeTab = getActiveTab(params);
  const peoplePage = parsePage(params.page);
  const peopleSearch = params.search?.trim() || undefined;

  const [
    allSeeds,
    supporterEmailsMap,
    adminEmails,
    councilMembers,
    usersPage,
    allComments,
    homepagePhase,
    bannerConfig,
  ] = await Promise.all([
    activeTab === "seeds" ? getAllProjects() : Promise.resolve([]),
    activeTab === "seeds"
      ? getSupporterEmailsMap()
      : Promise.resolve(new Map<string, string[]>()),
    activeTab === "settings" ? getAdminEmails() : Promise.resolve([]),
    activeTab === "settings" ? getCouncilMembers() : Promise.resolve([]),
    activeTab === "users"
      ? getUsersPage({ page: peoplePage, search: peopleSearch })
      : Promise.resolve({
          users: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: USERS_PER_PAGE,
        }),
    activeTab === "insights" ? getAllComments() : Promise.resolve([]),
    activeTab === "settings" ? getHomepagePhase() : Promise.resolve<1 | 2>(1),
    activeTab === "settings"
      ? getBannerConfig()
      : Promise.resolve({ enabled: false, message: "", href: "" }),
  ]);

  if (
    activeTab === "users" &&
    usersPage.currentPage > Math.max(1, usersPage.totalPages)
  ) {
    redirectToLastPeoplePage(usersPage.totalPages, peopleSearch);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage community seed proposals
        </p>
      </div>

      <AdminTabs activeTab={activeTab}>
        <div className="-mx-4 px-4 pb-1 sm:overflow-x-auto">
          <TabsList className="grid w-full grid-cols-3 gap-1 group-data-[orientation=horizontal]/tabs:h-auto sm:inline-flex sm:w-fit sm:min-w-max sm:gap-0 sm:group-data-[orientation=horizontal]/tabs:h-9">
            <TabsTrigger
              className="h-11 min-w-0 sm:h-[calc(100%-1px)]"
              value="seeds"
            >
              Seeds
            </TabsTrigger>
            <TabsTrigger
              className="h-11 min-w-0 sm:h-[calc(100%-1px)]"
              value="insights"
            >
              Comments
            </TabsTrigger>
            <TabsTrigger
              className="h-11 min-w-0 sm:h-[calc(100%-1px)]"
              value="export"
            >
              Export
            </TabsTrigger>
            <TabsTrigger
              className="h-11 min-w-0 sm:h-[calc(100%-1px)]"
              value="users"
            >
              People
            </TabsTrigger>
            <TabsTrigger
              className="h-11 min-w-0 sm:h-[calc(100%-1px)]"
              value="settings"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="users">
          <div className="mt-4 space-y-4">
            <h2 className="text-lg font-semibold">All People</h2>
            <UserList
              users={usersPage.users}
              totalCount={usersPage.totalCount}
              totalPages={usersPage.totalPages}
              currentPage={usersPage.currentPage}
              pageSize={usersPage.pageSize}
              search={peopleSearch}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="mt-4 space-y-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Site Banner</h2>
                <p className="text-muted-foreground text-sm">
                  Shown at the top of every page. Use it to promote an event or
                  announcement, then disable when it&apos;s over.
                </p>
              </div>
              <BannerSettings initial={bannerConfig} />
            </div>
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
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Council</h2>
                <p className="text-muted-foreground text-sm">
                  Council members can view every Sprout&apos;s team page and
                  post updates there, even on Sprouts they&apos;re not
                  personally part of — a trusted, cross-project role, not
                  site-wide admin powers. This is separate from being a
                  City/County Steward on a specific Sprout: granting Council
                  here doesn&apos;t make someone a Steward anywhere, and being a
                  Steward doesn&apos;t make someone Council. Grant this
                  deliberately.
                </p>
              </div>
              <CouncilList members={councilMembers} />
            </div>
          </div>
        </TabsContent>
      </AdminTabs>
    </div>
  );
}

function getActiveTab(params: {
  page?: string;
  search?: string;
  tab?: string;
}): AdminTab {
  if (isAdminTab(params.tab)) return params.tab;
  return params.page || params.search ? "users" : "seeds";
}

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function redirectToLastPeoplePage(
  totalPages: number,
  search: string | undefined,
): never {
  const params = new URLSearchParams({ tab: "users" });
  if (search) params.set("search", search);
  if (totalPages > 1) params.set("page", String(totalPages));
  redirect(`/admin?${params.toString()}`);
}
