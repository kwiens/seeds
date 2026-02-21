"use client";

import { useOptimistic, useTransition } from "react";
import { signIn, useSession } from "next-auth/react";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSupport } from "@/lib/actions/support";

export function SupportButton({
  seedId,
  supportCount,
  hasSupported,
}: {
  seedId: string;
  supportCount: number;
  hasSupported: boolean;
}) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { count: supportCount, supported: hasSupported },
    (state) => ({
      count: state.supported ? state.count - 1 : state.count + 1,
      supported: !state.supported,
    }),
  );

  function handleClick() {
    if (!session) {
      signIn("google");
      return;
    }

    startTransition(async () => {
      setOptimistic(optimistic);
      await toggleSupport(seedId);
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={optimistic.supported ? "default" : "outline"}
      className="min-w-44 gap-2"
    >
      <Sun
        className={`size-4 ${optimistic.supported ? "text-amber-300" : "text-amber-500"}`}
      />
      {optimistic.supported ? "Supporting" : "Support This Seed"}
      <span className="rounded-full bg-background/20 px-2 py-0.5 text-xs">
        {optimistic.count}
      </span>
    </Button>
  );
}
