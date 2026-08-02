"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoteFromCouncil, promoteToCouncil } from "@/lib/actions/council";

type CouncilMember = {
  id: string;
  name: string;
  email: string;
};

export function CouncilList({ members }: { members: CouncilMember[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    const email = formData.get("email") as string;
    if (!email) return;
    setError(null);
    startTransition(async () => {
      const result = await promoteToCouncil(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await demoteFromCouncil(id);
    });
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={handleAdd} className="flex gap-2">
        <Input
          name="email"
          type="email"
          placeholder="email@example.com"
          required
          disabled={isPending}
          className="max-w-sm"
        />
        <Button type="submit" disabled={isPending}>
          Promote to Council
        </Button>
      </form>

      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-2 py-1.5 text-xs">
          {error}
        </p>
      )}

      {members.length === 0 ? (
        <p className="text-muted-foreground text-sm">No Council members yet.</p>
      ) : (
        <ul className="divide-y">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between py-2"
            >
              <div>
                <span className="text-sm font-medium">{member.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {member.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleRemove(member.id)}
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
