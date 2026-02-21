import { SeedCard } from "@/components/seeds/seed-card";
import type { CategoryKey } from "@/lib/categories";

interface SeedData {
  id: string;
  name: string;
  summary: string;
  category: CategoryKey;
  supportCount: number;
  imageUrl?: string | null;
}

export function SeedListView({ seeds }: { seeds: SeedData[] }) {
  if (seeds.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-lg">
          No seeds planted yet. Be the first to share an idea!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {seeds.map((seed) => (
        <SeedCard
          key={seed.id}
          id={seed.id}
          name={seed.name}
          summary={seed.summary}
          category={seed.category}
          supportCount={seed.supportCount}
          imageUrl={seed.imageUrl}
        />
      ))}
    </div>
  );
}
