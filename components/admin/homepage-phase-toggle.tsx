"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setHomepagePhase } from "@/lib/actions/admin";

export function HomepagePhaseToggle({ currentPhase }: { currentPhase: 1 | 2 }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2 rounded-lg border p-1">
        <Button
          variant={currentPhase === 1 ? "secondary" : "ghost"}
          size="sm"
          disabled={isPending || currentPhase === 1}
          onClick={() =>
            startTransition(async () => {
              await setHomepagePhase(1);
            })
          }
        >
          Phase 1: Seed Gathering
        </Button>
        <Button
          variant={currentPhase === 2 ? "secondary" : "ghost"}
          size="sm"
          disabled={isPending || currentPhase === 2}
          onClick={() =>
            startTransition(async () => {
              await setHomepagePhase(2);
            })
          }
        >
          Phase 2: Seed Nurturing
        </Button>
      </div>
      <span className="text-muted-foreground text-sm">
        Currently: Phase {currentPhase}
      </span>
    </div>
  );
}
