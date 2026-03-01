import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Pencil } from "lucide-react";
import { SeedIcon, type SeedIconName } from "@/components/icons/seed-icons";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { SeedImageGenerator } from "@/components/seeds/seed-image-generator";
import { SupportButton } from "@/components/seeds/support-button";
import { SeedDetailMap } from "./seed-detail-map";
import {
  getSeedById,
  getSeedSupportCount,
  getSeedSupporters,
  hasUserSupported,
} from "@/lib/db/queries/seeds";
import { buildImagePrompt } from "@/lib/image-prompt";

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
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <SeedIcon name={seedIcon} />
        {label}
      </h3>
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
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <SeedIcon name="roots" />
        Roots (Organizations)
      </h3>
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

function parseRoots(raw: unknown): { name: string; committed: boolean }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { name: item, committed: false };
    if (typeof item === "object" && item && "name" in item) {
      return {
        name: String((item as { name: string }).name),
        committed: Boolean((item as { committed: boolean }).committed),
      };
    }
    return { name: String(item), committed: false };
  });
}

function formatSupporterName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const seed = await getSeedById(params.id);
  if (!seed) return { title: "Seed Not Found" };
  return {
    title: `${seed.name} | Seeds`,
    description: seed.summary.slice(0, 160),
  };
}

export default async function SeedPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  const seed = await getSeedById(params.id);
  if (!seed) notFound();

  const canEdit = canEditSeed(session, seed);

  // Pending seeds are intentionally public so creators can share links
  // before approval. Only archived seeds are restricted to owner/admin.
  if (seed.status === "archived" && !canEdit) {
    notFound();
  }

  const [supportCount, supporters, userHasSupported] = await Promise.all([
    getSeedSupportCount(seed.id),
    getSeedSupporters(seed.id, { includeEmail: canEdit }),
    session?.user?.id ? hasUserSupported(seed.id, session.user.id) : false,
  ]);

  const hasLocation = seed.locationLat && seed.locationLng;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Title row — full width */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <CategoryBadge category={seed.category} className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">{seed.name}</h1>
          {seed.status === "pending" && (
            <Badge variant="outline" className="mt-2">
              Pending Approval
            </Badge>
          )}
          {seed.status === "archived" && (
            <Badge variant="outline" className="mt-2">
              Archived
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/seeds/${seed.id}/edit`}>
                <Pencil className="mr-1.5 size-3.5" />
                Edit
              </Link>
            </Button>
          )}
          <SupportButton
            seedId={seed.id}
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
              <AvatarImage src={seed.creator.image ?? undefined} />
              <AvatarFallback>
                {(seed.creator.name ?? "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{seed.creator.name}</p>
              <p className="text-muted-foreground text-xs">Planted this seed</p>
            </div>
          </div>

          {/* Summary */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{seed.summary}</p>
          </div>
        </div>

        {/* Image — top right on desktop, below on mobile */}
        <div className="flex flex-col gap-4">
          {seed.imageUrl ? (
            <a
              href={seed.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl"
            >
              <Image
                src={seed.imageUrl}
                alt={buildImagePrompt(seed)}
                width={720}
                height={720}
                className="h-auto w-full"
                sizes="(max-width: 768px) 100vw, 360px"
                priority
              />
            </a>
          ) : (
            canEdit && <SeedImageGenerator seedId={seed.id} />
          )}
        </div>
      </div>

      {/* Map — full width */}
      {hasLocation && (
        <div className="mb-8">
          <SeedDetailMap
            lat={seed.locationLat!}
            lng={seed.locationLng!}
            address={seed.locationAddress}
          />
        </div>
      )}

      <Separator className="mb-8" />

      {/* Details grid */}
      <div className="grid gap-8 sm:grid-cols-2">
        <DetailList
          items={seed.gardeners}
          seedIcon="gardeners"
          label="Gardeners (Organizers)"
        />
        <RootsDetailList roots={parseRoots(seed.roots)} />
        <DetailList
          items={seed.supportPeople}
          seedIcon="support"
          label="Guides (People)"
        />
        <DetailList
          items={seed.waterHave}
          seedIcon="soil"
          label="Fertilizer: What We Have"
        />
        <DetailList
          items={seed.waterNeed}
          seedIcon="water"
          label="Water: What We Need"
        />
      </div>

      {/* Obstacles */}
      {seed.obstacles && (
        <div className="mt-8">
          <h3 className="mb-2 text-sm font-semibold">Obstacles</h3>
          <p className="text-muted-foreground whitespace-pre-wrap text-sm">
            {seed.obstacles}
          </p>
        </div>
      )}

      {/* Supporters */}
      {supporters.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <SeedIcon name="sunlight" />
            Sunlight ({supportCount}{" "}
            {supportCount === 1 ? "supporter" : "supporters"})
          </h3>
          <div className="flex flex-wrap gap-2">
            {supporters.map((s) =>
              canEdit ? (
                <a key={s.id} href={`mailto:${s.email}`} title={s.name}>
                  <Badge variant="secondary" className="hover:bg-secondary/80">
                    {formatSupporterName(s.name)}
                  </Badge>
                </a>
              ) : (
                <Badge key={s.id} variant="secondary">
                  {formatSupporterName(s.name)}
                </Badge>
              ),
            )}
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a href={`mailto:${supporters.map((s) => s.email).join(",")}`}>
                <Mail className="mr-1.5 size-3.5" />
                Email Supporters
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
