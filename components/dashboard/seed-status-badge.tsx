import { Badge } from "@/components/ui/badge";
import {
  projectDisplayState,
  projectStages,
  type ApprovalState,
  type ProjectStage,
} from "@/lib/project-stages";

export function SeedStatusBadge({
  stage,
  approvalState,
  archivedAt,
}: {
  stage: ProjectStage;
  approvalState: ApprovalState;
  archivedAt: Date | null;
}) {
  const variant = archivedAt
    ? "destructive"
    : approvalState === "draft"
      ? "outline"
      : approvalState === "pending"
        ? "secondary"
        : projectStages[stage].badgeVariant;

  return (
    <Badge variant={variant}>
      {projectDisplayState({ stage, approvalState, archivedAt })}
    </Badge>
  );
}
