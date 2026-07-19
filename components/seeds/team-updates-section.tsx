"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createTeamUpdate,
  replyToTeamUpdate,
} from "@/lib/actions/team-updates";
import { TEAM_UPDATE_MAX_LENGTH } from "@/lib/constants";
import { formatDisplayName, formatRelativeTime } from "@/lib/format";

interface TeamUpdateRow {
  id: string;
  title: string | null;
  body: string;
  parentId: string | null;
  createdAt: Date;
  userId: string;
  userName: string;
  userImage: string | null;
}

interface TeamUpdateWithReplies extends TeamUpdateRow {
  replies: TeamUpdateRow[];
}

export function TeamUpdatesSection({
  seedId,
  updates,
}: {
  seedId: string;
  updates: TeamUpdateWithReplies[];
}) {
  return (
    <div>
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="size-4" />
        Team Updates
      </h3>
      <p className="text-muted-foreground mb-4 text-sm">
        Private to this Sprout&apos;s team — post progress, needs, questions, or
        blockers, and reply back and forth here.
      </p>

      <NewUpdateForm seedId={seedId} />

      {updates.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No updates yet — post the first one to get the conversation going.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {updates.map((update) => (
            <UpdateThread key={update.id} update={update} seedId={seedId} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewUpdateForm({ seedId }: { seedId: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const remaining = TEAM_UPDATE_MAX_LENGTH - body.length;

  function handleSubmit() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createTeamUpdate(seedId, {
        title: title.trim() || undefined,
        body,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      setBody("");
    });
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        placeholder="Title (optional) — e.g. Site visit complete"
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={TEAM_UPDATE_MAX_LENGTH}
        placeholder="Progress, next steps, questions, needs, or blockers…"
        className="min-h-24"
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${remaining < 100 ? "text-destructive font-medium" : "text-muted-foreground"}`}
        >
          {remaining.toLocaleString()}/{TEAM_UPDATE_MAX_LENGTH.toLocaleString()}
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending || !body.trim()}
        >
          Post Update
        </Button>
      </div>
    </div>
  );
}

function UpdateThread({
  update,
  seedId,
}: {
  update: TeamUpdateWithReplies;
  seedId: string;
}) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div>
      <UpdateCard update={update} onReply={() => setShowReply(!showReply)} />

      {update.replies.length > 0 && (
        <div className="mt-3 ml-8 space-y-3 border-l-2 pl-4">
          {update.replies.map((reply) => (
            <UpdateCard key={reply.id} update={reply} />
          ))}
        </div>
      )}

      {showReply && (
        <div className="mt-3 ml-8 border-l-2 pl-4">
          <ReplyForm
            seedId={seedId}
            parentId={update.id}
            onDone={() => setShowReply(false)}
          />
        </div>
      )}
    </div>
  );
}

function ReplyForm({
  parentId,
  onDone,
}: {
  seedId: string;
  parentId: string;
  onDone: () => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const remaining = TEAM_UPDATE_MAX_LENGTH - body.length;

  function handleSubmit() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await replyToTeamUpdate(parentId, { body });
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      onDone();
    });
  }

  return (
    <div>
      {error && (
        <p className="bg-destructive/10 text-destructive mb-2 rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={TEAM_UPDATE_MAX_LENGTH}
        placeholder="Write a reply…"
        className="min-h-20"
      />
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-xs ${remaining < 100 ? "text-destructive font-medium" : "text-muted-foreground"}`}
        >
          {remaining.toLocaleString()}/{TEAM_UPDATE_MAX_LENGTH.toLocaleString()}
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending || !body.trim()}
        >
          Reply
        </Button>
      </div>
    </div>
  );
}

function UpdateCard({
  update,
  onReply,
}: {
  update: TeamUpdateRow;
  onReply?: () => void;
}) {
  return (
    <div className="group">
      <div className="flex items-start gap-3">
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={update.userImage ?? undefined} />
          <AvatarFallback className="text-xs">
            {(update.userName ?? "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-2">
            <span className="text-sm font-medium">
              {formatDisplayName(update.userName)}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(update.createdAt)}
            </span>
            {onReply && (
              <div className="ml-auto sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-auto px-1.5 py-0.5 text-xs"
                  onClick={onReply}
                >
                  <Reply className="size-3 sm:mr-1" />
                  <span className="hidden sm:inline">Reply</span>
                </Button>
              </div>
            )}
          </div>
          {update.title && (
            <p className="mt-1 text-sm font-semibold">{update.title}</p>
          )}
          <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
            {update.body}
          </p>
        </div>
      </div>
    </div>
  );
}
