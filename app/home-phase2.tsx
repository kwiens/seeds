import { StatusSection } from "@/components/seeds/status-section";
import type { StatusKey } from "@/lib/statuses";
import type { CategoryKey } from "@/lib/categories";

interface StatusPreview {
  status: StatusKey;
  seeds: {
    id: string;
    name: string;
    summary: string;
    category: CategoryKey;
    supportCount: number;
    imageUrl: string | null;
    coverPhotoUrl: string | null;
    status: string;
  }[];
  totalCount: number;
}

export function HomePhase2({ previews }: { previews: StatusPreview[] }) {
  const hasAnySeeds = previews.some((p) => p.totalCount > 0);

  if (!hasAnySeeds) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-lg">
          No seeds planted yet. Be the first to share an idea!
        </p>
      </div>
    );
  }

  return (
    <div>
      {previews.map((preview) => (
        <StatusSection
          key={preview.status}
          statusKey={preview.status}
          seeds={preview.seeds}
          totalCount={preview.totalCount}
        />
      ))}
    </div>
  );
}
