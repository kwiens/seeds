import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { canAccessTeamWorkspace, canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { hasTeamWorkspace, type ProjectStage } from "@/lib/project-stages";
import { isAdmin, isSignedIn, type SessionLike } from "@/lib/session";

/**
 * The single place that answers "what can this user do with this project?".
 *
 * Two capability levels exist:
 * - `manage`: edit the project, post public updates, run the team. Admins and
 *   active gardeners / co-gardeners.
 * - `team`: read and post in the private team workspace. Everyone who can
 *   manage, plus every other active non-supporter role, Council, and admins.
 *
 * The team workspace only exists for unarchived Sprouts and Trees, so `team`
 * access is false outside that window no matter who is asking. Pages, API
 * routes and server actions all go through here so that rule cannot drift.
 */

export interface ProjectAccessTarget {
  id: string;
  stage: ProjectStage;
  archivedAt: Date | null;
}

export interface ProjectAccess {
  canManage: boolean;
  /** True only when the workspace exists *and* the user may enter it. */
  canAccessTeam: boolean;
  /** Whether the stage and archive state allow a team workspace at all. */
  teamWorkspaceAvailable: boolean;
}

export function isTeamWorkspaceAvailable(project: {
  stage: ProjectStage;
  archivedAt: Date | null;
}): boolean {
  return !project.archivedAt && hasTeamWorkspace(project.stage);
}

export async function getProjectAccess(
  session: SessionLike,
  project: ProjectAccessTarget,
): Promise<ProjectAccess> {
  const teamWorkspaceAvailable = isTeamWorkspaceAvailable(project);
  const [canManage, canAccessTeam] = await Promise.all([
    canManageProject(session, project),
    teamWorkspaceAvailable ? canAccessTeamWorkspace(session, project) : false,
  ]);
  return { canManage, canAccessTeam, teamWorkspaceAvailable };
}

export type ProjectAccessLevel = "manage" | "team" | "admin";

export interface ProjectAccessCheck {
  level: ProjectAccessLevel;
  /**
   * Also require the team workspace to exist (unarchived Sprout or Tree).
   * Defaults to true for `team`, false otherwise.
   */
  requireWorkspace?: boolean;
  /** Message when the user lacks the capability. */
  forbidden?: string;
  /** Message when the workspace is required but the stage has none yet. */
  unavailable?: string;
}

const DEFAULT_MESSAGES = {
  signedOut: "You must be signed in.",
  notFound: "Project not found.",
  archived: "This project has been archived.",
  unavailable: "The team workspace becomes available at the Sprout stage.",
  forbidden: {
    manage: "You do not have permission to manage this project.",
    team: "You do not have access to this project's team workspace.",
    admin: "Only admins can do that.",
  },
} as const;

/**
 * Check an already-loaded project against a capability. Returns an error
 * message or null. Use this when the project came from a related row (an
 * event, an update) so there is no second lookup.
 */
export async function checkProjectAccess(
  session: SessionLike,
  project: ProjectAccessTarget,
  check: ProjectAccessCheck,
): Promise<string | null> {
  if (!isSignedIn(session)) return DEFAULT_MESSAGES.signedOut;

  const requireWorkspace = check.requireWorkspace ?? check.level === "team";
  if (requireWorkspace) {
    if (project.archivedAt) return DEFAULT_MESSAGES.archived;
    if (!hasTeamWorkspace(project.stage)) {
      return check.unavailable ?? DEFAULT_MESSAGES.unavailable;
    }
  }

  const allowed =
    check.level === "admin"
      ? isAdmin(session)
      : check.level === "manage"
        ? await canManageProject(session, project)
        : await canAccessTeamWorkspace(session, project);
  if (!allowed) {
    return check.forbidden ?? DEFAULT_MESSAGES.forbidden[check.level];
  }
  return null;
}

/**
 * Load the current session and the project, then check access. The common
 * first step of a server action: `if ("error" in access) return access;`.
 */
export async function requireProjectAccess(
  projectId: string,
  check: ProjectAccessCheck,
): Promise<
  | { error: string }
  | {
      session: NonNullable<SessionLike>;
      project: ProjectAccessTarget;
    }
> {
  const session = await auth();
  if (!isSignedIn(session)) return { error: DEFAULT_MESSAGES.signedOut };

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, stage: true, archivedAt: true },
  });
  if (!project) return { error: DEFAULT_MESSAGES.notFound };

  // Pass the row through rather than reshaping it so the capability checks
  // see every column the query returned.
  const target: ProjectAccessTarget = {
    ...project,
    archivedAt: project.archivedAt ?? null,
  };
  const error = await checkProjectAccess(session, target, check);
  if (error) return { error };
  return { session, project: target };
}
