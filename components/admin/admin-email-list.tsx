"use client";

import { useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAdminEmail, removeAdminEmail } from "@/lib/actions/admin-emails";

type AdminEmailRow = {
  id: string;
  email: string;
  addedByName: string | null;
  createdAt: Date;
};

export function AdminEmailList({
  dbEmails,
  envEmails,
}: {
  dbEmails: AdminEmailRow[];
  envEmails: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    const email = formData.get("email") as string;
    if (!email) return;
    startTransition(async () => {
      const result = await addAdminEmail(email);
      if (result.success) {
        formRef.current?.reset();
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeAdminEmail(id);
    });
  }

  // Combine env-only emails (not already in DB) with DB emails
  const dbEmailSet = new Set(dbEmails.map((e) => e.email));
  const envOnlyEmails = envEmails.filter((e) => !dbEmailSet.has(e));

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
          Add
        </Button>
      </form>

      <ul className="divide-y">
        {envOnlyEmails.map((email) => (
          <li
            key={`env-${email}`}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{email}</span>
              <Badge variant="secondary">env</Badge>
            </div>
          </li>
        ))}
        {dbEmails.map((row) => (
          <li key={row.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">{row.email}</span>
              <Badge variant="outline">db</Badge>
              {envEmails.includes(row.email) && (
                <Badge variant="secondary">env</Badge>
              )}
            </div>
            {!envEmails.includes(row.email) && (
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleRemove(row.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
