import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";

/**
 * Invalidate every cached surface that renders a project: the public page and
 * its nested update pages, the explorer and stage listings, the admin table,
 * the dashboard, and the private workspace. Actions call this after any
 * project mutation instead of enumerating paths themselves. Over-invalidating
 * a few pages is cheap; a stale page is a bug report.
 */
export function revalidateProject(projectId: string) {
  revalidatePath(routes.home);
  revalidatePath(routes.stageListingPattern, "page");
  revalidatePath(routes.admin);
  revalidatePath(routes.dashboard);
  revalidatePath(routes.project(projectId), "layout");
  revalidatePath(routes.workspace(projectId), "layout");
}

/** Site-wide listings only, for new projects that have no page cached yet. */
export function revalidateProjectListings() {
  revalidatePath(routes.home);
  revalidatePath(routes.stageListingPattern, "page");
  revalidatePath(routes.admin);
  revalidatePath(routes.dashboard);
}
