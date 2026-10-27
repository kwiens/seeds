import { projectStages, type ProjectStage } from "@/lib/project-stages";

/**
 * Every URL the app links to or revalidates, in one place. Build paths with
 * these helpers rather than string templates so a route can move without a
 * repo-wide search.
 *
 * Public project pages live under /seeds for historical reasons: QR codes and
 * printed material point there. The private workspace lives under
 * /dashboard/projects.
 */

export type ProjectWorkspaceSection =
  | "edit"
  | "updates"
  | "supporters"
  | "team";

export const routes = {
  home: "/",
  about: "/about",
  faq: "/faq",
  admin: "/admin",
  dashboard: "/dashboard",
  harvestFest: "/harvest-fest",
  signIn: "/api/auth/signin",

  newProject: "/seeds/new",
  project: (projectId: string) => `/seeds/${projectId}`,
  projectQr: (projectId: string) => `/seeds/${projectId}/qr`,
  projectUpdate: (projectId: string, updateId: string) =>
    `/seeds/${projectId}/updates/${updateId}`,

  /** Public listing for one lifecycle stage, e.g. /status/sprouts. */
  stageListing: (stage: ProjectStage) => `/status/${projectStages[stage].slug}`,
  /** Route pattern for every stage listing, for revalidation. */
  stageListingPattern: "/status/[slug]",

  workspace: (projectId: string, section?: ProjectWorkspaceSection) => {
    const base = `/dashboard/projects/${projectId}`;
    return section ? `${base}/${section}` : base;
  },
  workspaceNewUpdate: (projectId: string) =>
    `/dashboard/projects/${projectId}/updates/new`,
  workspaceEditUpdate: (projectId: string, updateId: string) =>
    `/dashboard/projects/${projectId}/updates/${updateId}/edit`,

  invite: (token: string) => `/invite/${token}`,

  signInWithCallback: (callbackPath: string) =>
    `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`,
} as const;
