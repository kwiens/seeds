"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpdatesList } from "@/components/projects/updates-list";
import type { PublicProjectUpdateWithAuthor } from "@/lib/db/queries/project-updates";
import { routes } from "@/lib/routes";

export function ProjectDetailTabs({
  projectContent,
  updates,
  projectId,
  canEdit,
}: {
  projectContent: React.ReactNode;
  updates: PublicProjectUpdateWithAuthor[];
  projectId: string;
  canEdit: boolean;
}) {
  return (
    <Tabs defaultValue="project">
      <TabsList variant="line">
        <TabsTrigger value="project">Project</TabsTrigger>
        <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="project">{projectContent}</TabsContent>
      <TabsContent value="updates">
        <div className="py-4">
          {canEdit && (
            <div className="mb-6 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.workspace(projectId, "updates")}>
                  <Pencil className="mr-1.5 size-3.5" />
                  Manage Updates
                </Link>
              </Button>
            </div>
          )}
          <UpdatesList updates={updates} projectId={projectId} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
