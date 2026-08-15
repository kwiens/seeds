import { StatusSection } from "@/components/seeds/status-section";
import type { CategoryKey } from "@/lib/categories";
import type { ProjectStage } from "@/lib/project-stages";

interface StagePreview {
  stage: ProjectStage;
  projects: {
    id: string;
    name: string;
    summary: string;
    category: CategoryKey;
    supportCount: number;
    imageUrl: string | null;
    coverPhotoUrl: string | null;
    stage: ProjectStage;
    approvalState: "draft" | "pending" | "approved";
  }[];
  totalCount: number;
}

export function HomePhase2({ previews }: { previews: StagePreview[] }) {
  if (!previews.some((preview) => preview.totalCount > 0)) {
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
          key={preview.stage}
          stage={preview.stage}
          seeds={preview.projects}
          totalCount={preview.totalCount}
        />
      ))}
    </div>
  );
}
