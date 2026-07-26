"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpdatesList } from "@/components/seeds/updates-list";
import type { SeedUpdateWithAuthor } from "@/lib/db/queries/updates";

export function SeedDetailTabs({
  projectContent,
  updates,
  seedId,
  canEdit,
}: {
  projectContent: React.ReactNode;
  updates: SeedUpdateWithAuthor[];
  seedId: string;
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
