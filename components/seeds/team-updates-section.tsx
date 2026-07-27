"use client";

import { useState, useTransition } from "react";
import { FileText, MessageSquare, Reply, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type Attachment,
  AttachmentPicker,
} from "@/components/seeds/attachment-picker";
import {
  createTeamUpdate,
  deleteTeamUpdate,
  replyToTeamUpdate,
} from "@/lib/actions/team-updates";
import { TEAM_UPDATE_MAX_LENGTH } from "@/lib/constants";
import { formatDisplayName, formatRelativeTime } from "@/lib/format";

interface TeamUpdateRow {
  id: string;
  title: string | null;
  body: string;
  parentId: string | null;
  attachments: Attachment[];
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
  isAdmin,
  rolesByUserId = {},
}: {
  seedId: string;
  updates: TeamUpdateWithReplies[];
  isAdmin: boolean;
  rolesByUserId?: Record<string, string>;
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
            <UpdateThread
              key={update.id}
              update={update}
              seedId={seedId}
              isAdmin={isAdmin}
              rolesByUserId={rolesByUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewUpdateForm({ seedId }: { seedId: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
        attachments,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      setBody("");
      setAttachments([]);
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
      <AttachmentPicker attachments={attachments} onChange={setAttachments} />
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
  isAdmin,
  rolesByUserId,
}: {
  update: TeamUpdateWithReplies;
  seedId: string;
  isAdmin: boolean;
  rolesByUserId: Record<string, string>;
}) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div>
      <UpdateCard
        update={update}
        isAdmin={isAdmin}
        roleLabel={rolesByUserId[update.userId]}
        onReply={() => setShowReply(!showReply)}
      />

      {update.replies.length > 0 && (
        <div className="mt-3 ml-8 space-y-3 border-l-2 pl-4">
          {update.replies.map((reply) => (
            <UpdateCard
              key={reply.id}
              update={reply}
              isAdmin={isAdmin}
              roleLabel={rolesByUserId[reply.userId]}
            />
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const remaining = TEAM_UPDATE_MAX_LENGTH - body.length;

  function handleSubmit() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await replyToTeamUpdate(parentId, { body, attachments });
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      setAttachments([]);
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
      <div className="mt-2">
        <AttachmentPicker attachments={attachments} onChange={setAttachments} />
      </div>
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
  isAdmin,
  roleLabel,
  onReply,
}: {
  update: TeamUpdateRow;
  isAdmin: boolean;
  roleLabel?: string;
  onReply?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTeamUpdate(update.id);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div
      id={`update-${update.id}`}
      className="group scroll-mt-20 rounded-md target:bg-accent -m-2 p-2 transition-colors"
    >
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
            {roleLabel && (
              <Badge variant="secondary" className="text-xs">
                {roleLabel}
              </Badge>
            )}
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(update.createdAt)}
            </span>
            {(onReply || isAdmin) && (
              <div className="ml-auto flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                {onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-auto px-1.5 py-0.5 text-xs"
                    onClick={onReply}
                  >
                    <Reply className="size-3 sm:mr-1" />
                    <span className="hidden sm:inline">Reply</span>
                  </Button>
                )}
                {isAdmin && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-auto px-1.5 py-0.5 text-xs"
                      >
                        <Trash2 className="size-3 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete this update?</DialogTitle>
                        <DialogDescription>
                          This permanently removes it{" "}
                          {update.parentId === null
                            ? "and any replies to it "
                            : ""}
                          from the record. This can&apos;t be undone.
                        </DialogDescription>
                      </DialogHeader>
                      {error && (
                        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                          {error}
                        </p>
                      )}
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isPending}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </div>
          {update.title && (
            <p className="mt-1 text-sm font-semibold">{update.title}</p>
          )}
          <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
            {update.body}
          </p>
          {update.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {update.attachments.map((file) => (
                <a
                  key={file.url}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent hover:bg-accent/70 inline-flex max-w-[220px] items-center gap-1.5 rounded-full py-1 pr-2.5 pl-2 text-xs"
                >
                  <FileText className="text-muted-foreground size-3 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
