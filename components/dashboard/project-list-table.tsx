"use client";

import Link from "next/link";
import { Settings2, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/projects/category-badge";
import { ProjectStatusBadge } from "@/components/dashboard/project-status-badge";
import type { CategoryKey } from "@/config/categories";
import { routes } from "@/lib/routes";

interface DashboardProject {
  id: string;
  name: string;
  category: CategoryKey;
  stage: "seed" | "sprout" | "tree";
  approvalState: "draft" | "pending" | "approved";
  archivedAt: Date | null;
  supportCount: number;
  createdAt: Date;
}

export function DashboardProjectList({
  projects,
}: {
  projects: DashboardProject[];
}) {
  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={routes.project(project.id)}
                className="font-medium break-words hover:underline"
              >
                {project.name}
              </Link>
              <ProjectStatusBadge
                stage={project.stage}
                approvalState={project.approvalState}
                archivedAt={project.archivedAt}
              />
            </div>
            <div className="flex items-center gap-3">
              <CategoryBadge category={project.category} />
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Sun className="size-3.5 text-amber-500" aria-hidden="true" />
                {project.supportCount}
                <span className="sr-only">supporters</span>
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.workspace(project.id)}>
              <Settings2 className="mr-1.5 size-3.5" />
              Manage
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
