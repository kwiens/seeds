import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, QrCode, Settings2, Sun, Users } from "lucide-react";
import { SeedIcon, type SeedIconName } from "@/components/icons/seed-icons";
import { getReadableProject } from "@/lib/project-read-access";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryBadge } from "@/components/projects/category-badge";
import { ProjectStatusBadge } from "@/components/dashboard/project-status-badge";
import { CommentsSection } from "@/components/projects/comments-section";
import { ImageLightbox } from "@/components/projects/image-lightbox";
import { ProjectImageGenerator } from "@/components/projects/project-image-generator";
import { SupportButton } from "@/components/projects/support-button";
import { ExpandableText } from "@/components/projects/expandable-text";
import { ProjectDetailTabs } from "@/components/projects/project-detail-tabs";
import { PhotoGrid } from "@/components/photo-grid";
import { ProjectDetailMap } from "./project-detail-map";
import { getCommentsByProject } from "@/lib/db/queries/comments";
import { getPublicBudgets } from "@/lib/db/queries/budgets";
import { getPublicProjectUpdates } from "@/lib/db/queries/project-updates";
import {
  getProjectSupportCount,
  getProjectSupporters,
  hasUserSupported,
} from "@/lib/db/queries/projects";
import type { ProjectParticipant } from "@/lib/db/types";
import { getProjectAccess } from "@/lib/project-access";
import { formatDisplayName } from "@/lib/format";
import { buildImagePrompt } from "@/lib/image-prompt";
import { routes } from "@/lib/routes";

function DetailList({
  items,
  seedIcon,
  label,
}: {
  items: string[];
  seedIcon: SeedIconName;
  label: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <SeedIcon name={seedIcon} />
        {label}
      </h2>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-muted-foreground text-sm">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RootsDetailList({
  roots,
}: {
  roots: { name: string; committed: boolean }[];
}) {
  if (roots.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <SeedIcon name="roots" />
        Roots
      </h2>
      <ul className="space-y-1">
        {roots.map((root, i) => (
          <li key={i} className="text-muted-foreground text-sm">
            {root.name}
            {!root.committed && (
              <span className="ml-1 text-xs italic">(not committed yet)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function participantNames(
  participants: ProjectParticipant[],
  role: ProjectParticipant["role"],
) {
  return participants
    .filter(
      (participant) =>
        participant.role === role && participant.state !== "inactive",
    )
    .map((participant) => participant.displayName);
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const access = await getReadableProject(params.id);
  if (!access) return { title: "Seed Not Found" };
  const { project } = access;
  const ogImage = project.coverPhotoUrl ?? project.imageUrl;
  return {
    title: project.name,
    description: project.summary.slice(0, 160),
    openGraph: {
      title: project.name,
      description: project.summary.slice(0, 160),
      ...(ogImage && {
        images: [{ url: ogImage }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: project.name,
      description: project.summary.slice(0, 160),
      ...(ogImage && {
        images: [ogImage],
      }),
    },
  };
}

export default async function ProjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const access = await getReadableProject(params.id);
  if (!access) notFound();
  const { project, session, canManage: canEdit } = access;
  const { canAccessTeam: hasTeamAccess } = await getProjectAccess(
    session,
    project,
  );

  const [
    supportCount,
    supporters,
    userHasSupported,
    comments,
    updates,
    publicBudgets,
  ] = await Promise.all([
    getProjectSupportCount(project.id),
    getProjectSupporters(project.id, { includeEmail: canEdit }),
    session?.user?.id ? hasUserSupported(project.id, session.user.id) : false,
    getCommentsByProject(project.id),
    getPublicProjectUpdates(project.id),
    getPublicBudgets(project.id),
  ]);

  const hasLocation =
    project.locationLat !== null && project.locationLng !== null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Title row — full width */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <CategoryBadge category={project.category} className="mb-2" />
          <h1 className="break-words text-3xl font-bold tracking-tight">
            {project.name}
          </h1>
          {(project.stage !== "seed" ||
            project.approvalState !== "approved" ||
            project.archivedAt) && (
            <div className="mt-2">
              <ProjectStatusBadge
                stage={project.stage}
                approvalState={project.approvalState}
                archivedAt={project.archivedAt}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button variant="outline" asChild>
              <Link href={routes.workspace(project.id)}>
                <Settings2 className="mr-1.5 size-3.5" />
                Manage project
              </Link>
            </Button>
          ) : hasTeamAccess ? (
            <Button variant="outline" asChild>
              <Link href={routes.workspace(project.id, "team")}>
                <Users className="mr-1.5 size-3.5" />
                Team workspace
              </Link>
            </Button>
          ) : null}
          <SupportButton
            projectId={project.id}
            supportCount={supportCount}
            hasSupported={userHasSupported}
          />
        </div>
      </div>

      {/* Creator + summary beside image */}
      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_360px]">
        <div>
          {/* Creator */}
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={project.creator.image ?? undefined} />
              <AvatarFallback>
                {(project.creator.name ?? "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{project.creator.name}</p>
              <p className="text-muted-foreground text-xs">Planted this seed</p>
            </div>
          </div>

          {/* Summary */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ExpandableText text={project.summary} />
          </div>
        </div>

        {/* Image — top right on desktop, below on mobile */}
        <div className="flex flex-col gap-4">
          {(() => {
            const hero = project.coverPhotoUrl
              ? { src: project.coverPhotoUrl, alt: project.name }
              : project.imageUrl
                ? { src: project.imageUrl, alt: buildImagePrompt(project) }
                : null;
            if (!hero) return null;
            return (
              <ImageLightbox
                src={hero.src}
                alt={hero.alt}
                sizes="(max-width: 768px) 100vw, 360px"
                priority
              />
            );
          })()}
          {/* Always generate AI illustration if missing, even when cover photo is set */}
          {!project.imageUrl && canEdit && (
            <ProjectImageGenerator projectId={project.id} />
          )}
        </div>
      </div>

      {/* Photos — exclude cover photo (already shown as primary) */}
      {(() => {
        const displayPhotos = project.coverPhotoUrl
          ? project.photos.filter((url) => url !== project.coverPhotoUrl)
          : project.photos;
        if (displayPhotos.length === 0) return null;
        return (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold">Photos</h2>
            <PhotoGrid photos={displayPhotos} alt={project.name} />
          </div>
        );
      })()}

      {/* Project content — map, details, comments, supporters, etc. */}
      {(() => {
        const projectContent = (
          <>
            {/* Map — full width */}
            {hasLocation && (
              <div className="mb-8">
                <ProjectDetailMap
                  lat={project.locationLat!}
                  lng={project.locationLng!}
                  address={project.locationAddress}
                />
                {project.locationDescription && (
                  <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm">
                    {project.locationDescription}
                  </p>
                )}
              </div>
            )}

            <Separator className="mb-8" />

            {/* Details grid */}
            <div className="grid gap-8 sm:grid-cols-2">
              <DetailList
                items={participantNames(project.participants, "gardener")}
                seedIcon="gardeners"
                label="Gardeners"
              />
              <RootsDetailList
                roots={project.participants
                  .filter(
                    (participant) =>
                      participant.role === "roots" &&
                      participant.state !== "inactive",
                  )
                  .map((participant) => ({
                    name: participant.displayName,
                    committed: participant.state === "active",
                  }))}
              />
              <DetailList
                items={participantNames(project.participants, "guide")}
                seedIcon="support"
                label="Guides"
              />
              <DetailList
                items={project.waterHave}
                seedIcon="fertilizer"
                label="Fertilizer"
              />
              <DetailList
                items={project.waterNeed}
                seedIcon="water"
                label="Water"
              />
            </div>

            {/* Budget */}
            {project.budgetEstimate && (
              <div className="mt-8">
                <h2 className="mb-2 text-sm font-semibold">Budget estimate</h2>
                <p className="text-muted-foreground text-sm">
                  {project.budgetEstimate}
                </p>
              </div>
            )}

            {publicBudgets.map((budget) => (
              <div key={budget.id} className="mt-8">
                <h2 className="mb-2 text-sm font-semibold capitalize">
                  {budget.status} detailed budget
                </h2>
                <ul className="space-y-1 text-sm">
                  {budget.lineItems.map((item, index) => (
                    <li
                      key={`${budget.id}-${index}`}
                      className="flex justify-between gap-4"
                    >
                      <span className="text-muted-foreground min-w-0 break-words">
                        {item.label}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {item.amount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
                {budget.notes && (
                  <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm">
                    {budget.notes}
                  </p>
                )}
              </div>
            ))}

            {/* Obstacles */}
            {project.obstacles && (
              <div className="mt-8">
                <h2 className="mb-2 text-sm font-semibold">Obstacles</h2>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                  {project.obstacles}
                </p>
              </div>
            )}

            {/* Community Insights */}
            <div className="mt-8">
              <CommentsSection
                projectId={project.id}
                projectCreatorId={project.createdBy}
                comments={comments}
                canModerate={canEdit}
              />
            </div>

            {/* Supporters */}
            {supporters.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <SeedIcon name="sunlight" />
                  Sunlight ({supportCount}{" "}
                  {supportCount === 1 ? "supporter" : "supporters"})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {supporters.map((s) =>
                    canEdit ? (
                      <a key={s.id} href={`mailto:${s.email}`} title={s.name}>
                        <Badge
                          variant="secondary"
                          className="hover:bg-secondary/80"
                        >
                          {formatDisplayName(s.name)}
                        </Badge>
                      </a>
                    ) : (
                      <Badge key={s.id} variant="secondary">
                        {formatDisplayName(s.name)}
                      </Badge>
                    ),
                  )}
                </div>
                {canEdit && (
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={routes.workspace(project.id, "supporters")}>
                        <Sun className="mr-1.5 size-3.5" />
                        View Supporters
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`mailto:${supporters.map((s) => s.email).join(",")}`}
                      >
                        <Mail className="mr-1.5 size-3.5" />
                        Email Supporters
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* QR Code — always visible */}
            <div className="mt-8">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={routes.projectQr(project.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <QrCode className="mr-1.5 size-3.5" />
                  QR Code
                </a>
              </Button>
            </div>

            {/* AI illustration — shown at bottom when a user photo is the cover */}
            {project.coverPhotoUrl && project.imageUrl && (
              <div className="mt-12 flex justify-center">
                <ImageLightbox
                  src={project.imageUrl}
                  alt={`${project.name} illustration`}
                  thumbWidth={360}
                  thumbHeight={480}
                  sizes="320px"
                  triggerClassName="max-w-xs"
                />
              </div>
            )}
          </>
        );

        if (updates.length > 0) {
          return (
            <ProjectDetailTabs
              projectContent={projectContent}
              updates={updates}
              projectId={project.id}
              canEdit={canEdit}
            />
          );
        }

        return projectContent;
      })()}
    </div>
  );
}
