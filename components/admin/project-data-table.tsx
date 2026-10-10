"use client";

import { useState } from "react";
import Link from "next/link";
import { Sun } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/projects/category-badge";
import { ProjectStatusBadge } from "@/components/dashboard/project-status-badge";
import { ProjectActions } from "@/components/admin/project-actions";
import type { CategoryKey } from "@/config/categories";
import { routes } from "@/lib/routes";

interface AdminProject {
  id: string;
  name: string;
  category: CategoryKey;
  stage: "seed" | "sprout" | "tree";
  approvalState: "draft" | "pending" | "approved";
  archivedAt: Date | null;
  badges: string[];
  createdAt: Date;
  creatorName: string;
  creatorEmail: string;
  supportCount: number;
}

export function AdminProjectTable({
  projects,
  supporterEmailsMap,
}: {
  projects: AdminProject[];
  supporterEmailsMap: Record<string, string[]>;
}) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filtered = projects.filter((s) => {
    if (stageFilter === "archived" && !s.archivedAt) return false;
    if (
      stageFilter !== "all" &&
      stageFilter !== "archived" &&
      s.stage !== stageFilter
    )
      return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="seed">Seed</SelectItem>
            <SelectItem value="sprout">Sprout</SelectItem>
            <SelectItem value="tree">Tree</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Creator</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">
                <Sun aria-hidden className="inline size-4 text-amber-500" />
                <span className="sr-only">Supporters</span>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No seeds found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={routes.project(project.id)}
                      className="block max-w-[400px] truncate font-medium hover:underline"
                      title={project.name}
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <p className="text-sm">{project.creatorName}</p>
                      <a
                        href={`mailto:${project.creatorEmail}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {project.creatorEmail.length > 25
                          ? `${project.creatorEmail.slice(0, 25)}…`
                          : project.creatorEmail}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <CategoryBadge category={project.category} />
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge
                      stage={project.stage}
                      approvalState={project.approvalState}
                      archivedAt={project.archivedAt}
                    />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {project.supportCount > 0 ? (
                      <Link
                        href={routes.workspace(project.id, "supporters")}
                        className="hover:underline"
                      >
                        {project.supportCount}
                      </Link>
                    ) : (
                      project.supportCount
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {new Date(project.createdAt).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell>
                    <ProjectActions
                      projectId={project.id}
                      stage={project.stage}
                      approvalState={project.approvalState}
                      archived={!!project.archivedAt}
                      badges={project.badges}
                      creatorEmail={project.creatorEmail}
                      supporterEmails={supporterEmailsMap[project.id]}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
