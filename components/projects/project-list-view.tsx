import { ProjectCard } from "@/components/projects/project-card";
import type { CategoryKey } from "@/config/categories";

interface SeedData {
  id: string;
  name: string;
  summary: string;
  category: CategoryKey;
  supportCount: number;
  imageUrl?: string | null;
  coverPhotoUrl?: string | null;
  stage: "seed" | "sprout" | "tree";
  approvalState: "draft" | "pending" | "approved";
}

export function ProjectListView({ projects }: { projects: SeedData[] }) {
  if (projects.length === 0) {
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
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          name={project.name}
          summary={project.summary}
          category={project.category}
          supportCount={project.supportCount}
          imageUrl={project.imageUrl}
          coverPhotoUrl={project.coverPhotoUrl}
          stage={project.stage}
          approvalState={project.approvalState}
        />
      ))}
    </div>
  );
}
