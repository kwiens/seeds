"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectStages, publicProjectStageOrder } from "@/lib/project-stages";

const ALL = "all";

/** Stage filter for the admin project table, kept in the `stage` URL param. */
export function ProjectStageFilter({ value }: { value?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function change(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === ALL) params.delete("stage");
    else params.set("stage", next);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `?${query}` : "?");
  }

  return (
    <Select value={value ?? ALL} onValueChange={change}>
      <SelectTrigger className="w-40" aria-label="Filter by stage">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All stages</SelectItem>
        {publicProjectStageOrder.map((stage) => (
          <SelectItem key={stage} value={stage}>
            {projectStages[stage].label}
          </SelectItem>
        ))}
        <SelectItem value="archived">Archived</SelectItem>
      </SelectContent>
    </Select>
  );
}
