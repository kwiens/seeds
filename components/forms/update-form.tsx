"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createUpdate, editUpdate } from "@/lib/actions/updates";

interface UpdateFormProps {
  seedId: string;
  update?: {
    id: string;
    title: string;
    body: string;
  };
}

export function UpdateForm({ seedId, update }: UpdateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(update?.title ?? "");
  const [body, setBody] = useState(update?.body ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = { title, body };

    startTransition(async () => {
      const result = update
        ? await editUpdate(update.id, formData)
        : await createUpdate(seedId, formData);

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(`/seeds/${seedId}/updates`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <fieldset disabled={isPending} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="What's new with your seed?"
            required
          />
          <p className="text-muted-foreground text-xs">
            {title.length}/200 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Body</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={20000}
            placeholder="Share your progress, milestones, or news..."
            rows={12}
            required
          />
          <p className="text-muted-foreground text-xs">
            {body.length.toLocaleString()}/20,000 characters
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : update ? "Save Changes" : "Post Update"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/seeds/${seedId}/updates`)}
          >
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
