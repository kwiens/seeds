import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { Badge } from "@/components/ui/badge";
import { categories, type CategoryKey } from "@/lib/categories";
import { Heart, Sun } from "lucide-react";

interface SeedCardProps {
  id: string;
  name: string;
  category: CategoryKey;
  supportCount: number;
  summary?: string;
  imageUrl?: string | null;
  coverPhotoUrl?: string | null;
  status?: string;
}

export function SeedCard({
  id,
  name,
  category,
  supportCount,
  summary,
  imageUrl,
  coverPhotoUrl,
  status,
}: SeedCardProps) {
  const info = categories[category];
  const Icon = info.icon;

  // Proposed seeds (pending) use the AI image; all other stages prefer the cover photo
  const displayImage =
    status === "pending" ? imageUrl : (coverPhotoUrl ?? imageUrl);

  return (
    <Link href={`/seeds/${id}`} className="min-w-0">
      <Card className="group h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
        {displayImage ? (
          <div className="relative h-52 overflow-hidden rounded-t-lg sm:h-40">
            <Image
              src={displayImage}
              alt={name}
              fill
              className="object-cover scale-110 transition-transform group-hover:scale-115"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        ) : (
          <div
            className={`relative flex h-52 items-center justify-center rounded-t-lg bg-gradient-to-br sm:h-40 ${info.gradient}`}
          >
            <Icon className="size-16 text-white/80 transition-transform group-hover:scale-110" />
          </div>
        )}
        <CardContent className="p-4">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={category} />
            {status === "approved" && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                <Heart className="size-3 fill-current" />
                Community Supported
              </Badge>
            )}
          </div>
          <h3 className="line-clamp-2 font-semibold leading-tight">{name}</h3>
          {summary && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {summary}
            </p>
          )}
          <div className="text-muted-foreground mt-3 flex items-center gap-1 text-sm">
            <Sun className="size-4 text-amber-500" />
            <span>
              {supportCount} {supportCount === 1 ? "supporter" : "supporters"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
