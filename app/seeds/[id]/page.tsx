import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Pencil, Users, Building2, Droplets, Sun } from "lucide-react";
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

function DetailList({
  items,
  icon: Icon,
  label,
  iconClassName,
}: {
  items: string[];
  icon: LucideIcon;
  label: string;
  iconClassName?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className={`size-4${iconClassName ? ` ${iconClassName}` : ""}`} />
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

  // Archived seeds are only visible to owner/admin
  if (seed.status === "archived" && !canEditSeed(session, seed)) {
    notFound();
  }

  const [supportCount, supporters, userHasSupported] = await Promise.all([
    getSeedSupportCount(seed.id),
    getSeedSupporters(seed.id),
    session?.user?.id ? hasUserSupported(seed.id, session.user.id) : false,
  ]);

  const canEdit = canEditSeed(session, seed);

  const hasLocation = seed.locationLat && seed.locationLng;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header: title + map side by side on desktop */}
      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
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

        {/* Image + map — top right on desktop, below on mobile */}
        <div className="flex flex-col gap-4">
          {seed.imageUrl ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <Image
                src={seed.imageUrl}
                alt={seed.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
                priority
              />
            </div>
          ) : (
            canEdit && <SeedImageGenerator seedId={seed.id} />
          )}
          {hasLocation && (
            <SeedDetailMap
              lat={seed.locationLat!}
              lng={seed.locationLng!}
              address={seed.locationAddress}
            />
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Details grid */}
      <div className="grid gap-8 sm:grid-cols-2">
        <DetailList items={seed.gardeners} icon={Users} label="Gardeners" />
        <DetailList
          items={seed.roots}
          icon={Building2}
          label="Roots (Organizations)"
        />
        <DetailList
          items={seed.supportPeople}
          icon={Users}
          label="Support (People)"
        />
        <DetailList
          items={seed.waterHave}
          icon={Droplets}
          label="Water: What We Have"
          iconClassName="text-blue-500"
        />
        <DetailList
          items={seed.waterNeed}
          icon={Droplets}
          label="Water: What We Need"
          iconClassName="text-cyan-500"
        />
      </div>

      {/* Supporters */}
      {supporters.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sun className="size-4 text-amber-500" />
            Sunlight ({supportCount}{" "}
            {supportCount === 1 ? "supporter" : "supporters"})
          </h3>
          <div className="flex flex-wrap gap-2">
            {supporters.map((s) => (
              <Badge key={s.id} variant="secondary">
                {formatSupporterName(s.name)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
