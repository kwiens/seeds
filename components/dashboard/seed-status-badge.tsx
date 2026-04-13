import { Badge } from "@/components/ui/badge";
import { statuses, type StatusKey } from "@/lib/statuses";

const extraStatusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  draft: { label: "Draft", variant: "outline" },
  archived: { label: "Archived", variant: "destructive" },
};

export function SeedStatusBadge({ status }: { status: string }) {
  const statusInfo = statuses[status as StatusKey];
  if (statusInfo) {
    return <Badge variant={statusInfo.badgeVariant}>{statusInfo.label}</Badge>;
  }

  const config = extraStatusConfig[status] ?? {
    label: status,
    variant: "outline" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
