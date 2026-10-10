import Link from "next/link";
import { Sun } from "lucide-react";
import { ProjectActions } from "@/components/admin/project-actions";
import { ProjectStageFilter } from "@/components/admin/project-stage-filter";
import { ProjectStatusBadge } from "@/components/dashboard/project-status-badge";
import { CategoryBadge } from "@/components/projects/category-badge";
import { Pagination } from "@/components/projects/pagination";
import { SearchInput } from "@/components/projects/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CategoryKey } from "@/config/categories";
import { siteConfig } from "@/config/site";
import type { ApprovalState, ProjectStage } from "@/lib/project-stages";
import { routes } from "@/lib/routes";

interface AdminProject {
  id: string;
  name: string;
  category: CategoryKey;
  stage: ProjectStage;
  approvalState: ApprovalState;
  archivedAt: Date | null;
  badges: string[];
  createdAt: Date;
  creatorName: string;
  creatorEmail: string;
  supportCount: number;
}

const numberFormatter = new Intl.NumberFormat(siteConfig.locale);
const createdFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  timeZone: siteConfig.timeZone,
});

/**
 * Server component: the page loads one database page and passes it in.
 * Search, stage filter and paging all live in the URL.
 */
export function AdminProjectTable({
  currentPage,
  pageSize,
  projects,
  search,
  stage,
  supporterEmailsMap,
  totalCount,
  totalPages,
}: {
  currentPage: number;
  pageSize: number;
  projects: AdminProject[];
  search?: string;
  stage?: string;
  supporterEmailsMap: Record<string, string[]>;
  totalCount: number;
  totalPages: number;
}) {
  const firstResult =
    projects.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = firstResult + projects.length - 1;
  const resultSummary =
    totalCount === 0
      ? "0 seeds"
      : `Showing ${numberFormatter.format(firstResult)}–${numberFormatter.format(lastResult)} of ${numberFormatter.format(totalCount)}`;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          ariaLabel="Search seeds by name"
          placeholder="Search by name..."
        />
        <ProjectStageFilter value={stage} />
        <p
          role="status"
          className="text-muted-foreground text-sm whitespace-nowrap sm:ml-auto"
        >
          {resultSummary}
        </p>
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
            {projects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  {search || stage ? "No seeds match." : "No seeds yet."}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
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
                        className="block max-w-[220px] truncate text-xs text-muted-foreground hover:underline"
                        title={project.creatorEmail}
                      >
                        {project.creatorEmail}
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
                    {createdFormatter.format(project.createdAt)}
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

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
