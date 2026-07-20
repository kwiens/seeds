"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpdatesList } from "@/components/seeds/updates-list";
import type { SeedUpdateWithAuthor } from "@/lib/db/queries/updates";

const TEAM_TAB_LINK_CLASS =
  "text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all";

export function SeedDetailTabs({
  projectContent,
  updates,
  seedId,
  canEdit,
  teamHref,
}: {
  projectContent: React.ReactNode;
  updates: SeedUpdateWithAuthor[];
  seedId: string;
  canEdit: boolean;
  /** When present, renders a "Team" tab that links to the Sprout's private Team page. */
  teamHref?: string;
}) {
  return (
    <Tabs defaultValue="project">
      <TabsList variant="line">
        <TabsTrigger value="project">Project</TabsTrigger>
        <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
        {teamHref && (
          <Link href={teamHref} className={TEAM_TAB_LINK_CLASS}>
            Team
          </Link>
        )}
      </TabsList>
      <TabsContent value="project">{projectContent}</TabsContent>
      <TabsContent value="updates">
        <div className="py-4">
          {canEdit && (
            <div className="mb-6 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/seeds/${seedId}/updates`}>
                  <Pencil className="mr-1.5 size-3.5" />
                  Manage Updates
                </Link>
              </Button>
            </div>
          )}
          <UpdatesList updates={updates} seedId={seedId} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
