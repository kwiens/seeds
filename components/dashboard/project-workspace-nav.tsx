"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Pencil, Sun, Users, type LucideIcon } from "lucide-react";
import {
  projectWorkspacePath,
  type ProjectWorkspaceSection,
} from "@/lib/project-workspace-navigation";
import { cn } from "@/lib/utils";

interface WorkspaceNavItem {
  section: ProjectWorkspaceSection;
  label: string;
  icon: LucideIcon;
}

const managerItems: WorkspaceNavItem[] = [
  { section: "edit", label: "Edit Project", icon: Pencil },
  { section: "updates", label: "Public Updates", icon: FileText },
  { section: "supporters", label: "Supporters", icon: Sun },
];

export function ProjectWorkspaceNav({
  projectId,
  canManage,
  canAccessTeam,
}: {
  projectId: string;
  canManage: boolean;
  canAccessTeam: boolean;
}) {
  const pathname = usePathname();
  const items = [
    ...(canAccessTeam
      ? [{ section: "team", label: "Team Workspace", icon: Users } as const]
      : []),
    ...(canManage ? managerItems : []),
  ];

  return (
    <nav aria-label="Project workspace" className="overflow-x-auto border-b">
      <div className="flex min-w-max gap-1">
        {items.map(({ section, label, icon: Icon }) => {
          const href = projectWorkspacePath(projectId, section);
          const isActive =
            pathname === href ||
            (section === "updates" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={section}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 relative inline-flex items-center gap-1.5 rounded-sm px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px]",
                isActive &&
                  "text-foreground after:bg-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
