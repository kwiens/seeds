import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { categories, type CategoryKey } from "@/lib/categories";
import { Sun } from "lucide-react";

interface SeedCardProps {
  id: string;
  name: string;
  category: CategoryKey;
  supportCount: number;
  summary?: string;
  imageUrl?: string | null;
}

export function SeedCard({
  id,
  name,
  category,
  supportCount,
  summary,
  imageUrl,
}: SeedCardProps) {
  const info = categories[category];
  const Icon = info.icon;

  return (
    <Link href={`/seeds/${id}`}>
      <Card className="group h-full gap-0 py-0 transition-shadow hover:shadow-md">
        {imageUrl ? (
          <div className="relative h-52 overflow-hidden rounded-t-lg sm:h-40">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
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
          <CategoryBadge category={category} className="mb-2" />
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
