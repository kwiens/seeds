import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, MapPin, Users, Building2, Droplets } from "lucide-react";
import { auth } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { SeedImageGenerator } from "@/components/seeds/seed-image-generator";
import { SupportButton } from "@/components/seeds/support-button";
import { SeedDetailMap } from "./seed-detail-map";
import type { CategoryKey } from "@/lib/categories";
import {
  getSeedById,
  getSeedSupportCount,
  getSeedSupporters,
  hasUserSupported,
} from "@/lib/db/queries/seeds";

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

  // If not approved and not the owner/admin, 404
  if (seed.status !== "approved") {
    if (
      !session?.user?.id ||
      (seed.createdBy !== session.user.id && session.user.role !== "admin")
    ) {
      notFound();
    }
  }

  const [supportCount, supporters, userHasSupported] = await Promise.all([
    getSeedSupportCount(seed.id),
    getSeedSupporters(seed.id),
    session?.user?.id ? hasUserSupported(seed.id, session.user.id) : false,
  ]);

  const canEdit =
    session?.user?.id === seed.createdBy || session?.user?.role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <CategoryBadge category={seed.category as CategoryKey} className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">{seed.name}</h1>
          {seed.status !== "approved" && (
            <Badge variant="outline" className="mt-2">
              {seed.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
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

      {/* Creator info */}
      <div className="mb-6 flex items-center gap-3">
        <Avatar className="size-10">
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

      <Separator className="mb-6" />

      {/* Seed image */}
      {seed.imageUrl ? (
        <div className="relative mb-8 aspect-square w-full overflow-hidden rounded-xl sm:aspect-[2/1]">
          <Image
            src={seed.imageUrl}
            alt={seed.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
        </div>
      ) : (
        canEdit && <SeedImageGenerator seedId={seed.id} />
      )}

      {/* Summary */}
      <div className="prose prose-neutral dark:prose-invert mb-8 max-w-none">
        <p className="whitespace-pre-wrap">{seed.summary}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gardeners */}
        {seed.gardeners.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Gardeners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {seed.gardeners.map((name, i) => (
                  <li key={i} className="text-sm">
                    {name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Location */}
        {seed.locationLat && seed.locationLng && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4" />
                Soil (Location)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {seed.locationAddress && (
                <p className="text-muted-foreground mb-3 text-sm">
                  {seed.locationAddress}
                </p>
              )}
              <SeedDetailMap lat={seed.locationLat} lng={seed.locationLng} />
            </CardContent>
          </Card>
        )}

        {/* Roots (organizations) */}
        {seed.roots.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" />
                Roots (Organizations)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {seed.roots.map((name, i) => (
                  <li key={i} className="text-sm">
                    {name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Support people */}
        {seed.supportPeople.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Support (People)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {seed.supportPeople.map((name, i) => (
                  <li key={i} className="text-sm">
                    {name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Water: Have */}
        {seed.waterHave.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Droplets className="size-4 text-blue-500" />
                Water: What We Have
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {seed.waterHave.map((item, i) => (
                  <li key={i} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Water: Need */}
        {seed.waterNeed.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Droplets className="size-4 text-cyan-500" />
                Water: What We Need
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {seed.waterNeed.map((item, i) => (
                  <li key={i} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Supporters */}
      {supporters.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            Sunlight ({supportCount} {supportCount === 1 ? "supporter" : "supporters"})
          </h2>
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
