"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/actions/invites";

export function AcceptInviteButton({
  token,
  roleLabel,
}: {
  token: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvite(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/projects/${result.projectId}/team`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        size="lg"
        disabled={isPending}
        onClick={handleAccept}
      >
        {isPending ? "Joining…" : `Accept — join as ${roleLabel}`}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
