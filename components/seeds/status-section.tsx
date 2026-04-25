import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SeedListView } from "@/components/seeds/seed-list-view";
import { statuses, type StatusKey } from "@/lib/statuses";
import type { CategoryKey } from "@/lib/categories";

interface SeedPreview {
  id: string;
  name: string;
  summary: string;
  category: CategoryKey;
  supportCount: number;
  imageUrl?: string | null;
  coverPhotoUrl?: string | null;
  status?: string;
}

export function StatusSection({
  statusKey,
  seeds,
  totalCount,
}: {
  statusKey: StatusKey;
  seeds: SeedPreview[];
  totalCount: number;
}) {
  const info = statuses[statusKey];
  const Icon = info.icon;

  if (totalCount === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <Icon className={`size-6 self-center ${info.textClass}`} />
          <h2 className="text-xl font-bold">{info.pluralLabel}</h2>
          <span className="text-muted-foreground text-sm font-normal uppercase tracking-wide">
            {info.sublabel}
          </span>
          <span className="text-muted-foreground text-sm">({totalCount})</span>
        </div>
        <Link
          href={`/status/${info.slug}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <SeedListView seeds={seeds} />
    </section>
  );
}
