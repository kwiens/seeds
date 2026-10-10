"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Archive, MessageCircle, Reply } from "lucide-react";
import { SignInButton } from "@/components/auth/sign-in-button";
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
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { addComment, archiveComment } from "@/lib/actions/comments";
import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import { formatDisplayName, formatRelativeTime } from "@/lib/format";

interface CommentRow {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  userId: string;
  userName: string;
  userImage: string | null;
}

interface CommentWithReplies extends CommentRow {
  replies: CommentRow[];
}

export function CommentsSection({
  projectId,
  projectCreatorId,
  comments,
  canModerate,
}: {
  projectId: string;
  projectCreatorId: string;
  comments: CommentWithReplies[];
  canModerate: boolean;
}) {
  return (
    <div>
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <MessageCircle className="size-4" />
        Community Insights
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Have a connection, suggestion, or perspective that could help this seed
        grow? Share it below.
      </p>

      <CommentForm projectId={projectId} />

      {comments.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No insights yet — be the first to share a suggestion.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              projectId={projectId}
              projectCreatorId={projectCreatorId}
              canModerate={canModerate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  projectId,
  parentId,
  onDone,
  placeholder,
  buttonLabel,
}: {
  projectId: string;
  parentId?: string;
  onDone?: () => void;
  placeholder?: string;
  buttonLabel?: string;
}) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const remaining = COMMENT_MAX_LENGTH - content.length;

  if (!session) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="mb-1 text-sm font-medium">Sign in to share an insight</p>
        <p className="text-muted-foreground mb-4 text-sm">
          We ask that you sign in with {siteConfig.auth.providerLabel} so the
          seed creator knows who&apos;s in their corner.
        </p>
        <SignInButton />
      </div>
    );
  }

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await addComment(projectId, content, parentId);
      if (result.success) {
        setContent("");
        onDone?.();
      }
    });
  }

  return (
    <div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={COMMENT_MAX_LENGTH}
        placeholder={
          placeholder ??
          "Maybe you know someone who could help, a similar project worth connecting, or just a thought worth sharing…"
        }
        className="min-h-24"
      />
      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-xs ${remaining < 50 ? "text-destructive font-medium" : "text-muted-foreground"}`}
        >
          {remaining.toLocaleString()}/{COMMENT_MAX_LENGTH.toLocaleString()}
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending || !content.trim()}
        >
          {buttonLabel ?? "Share Insight"}
        </Button>
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  projectId,
  projectCreatorId,
  canModerate,
}: {
  comment: CommentWithReplies;
  projectId: string;
  projectCreatorId: string;
  canModerate: boolean;
}) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div>
      <CommentCard
        comment={comment}
        projectCreatorId={projectCreatorId}
        canModerate={canModerate}
        onReply={() => setShowReply(!showReply)}
        showReplyButton={canModerate}
      />

      {comment.replies.length > 0 && (
        <div className="mt-3 ml-8 space-y-3 border-l-2 pl-4">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              projectCreatorId={projectCreatorId}
              canModerate={canModerate}
            />
          ))}
        </div>
      )}

      {showReply && (
        <div className="mt-3 ml-8 border-l-2 pl-4">
          <CommentForm
            projectId={projectId}
            parentId={comment.id}
            onDone={() => setShowReply(false)}
            placeholder="Write a reply…"
            buttonLabel="Reply"
          />
        </div>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  projectCreatorId,
  canModerate,
  onReply,
  showReplyButton,
}: {
  comment: CommentRow;
  projectCreatorId: string;
  canModerate: boolean;
  onReply?: () => void;
  showReplyButton?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isCreator = comment.userId === projectCreatorId;

  function handleArchive() {
    startTransition(async () => {
      await archiveComment(comment.id);
    });
  }

  return (
    <div className="group">
      <div className="flex items-start gap-3">
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={comment.userImage ?? undefined} />
          <AvatarFallback className="text-xs">
            {(comment.userName ?? "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-2">
            <span className="text-sm font-medium">
              {formatDisplayName(comment.userName)}
            </span>
            {isCreator && (
              <Badge variant="secondary" className="text-xs">
                Seed Creator
              </Badge>
            )}
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {canModerate && (
              <div className="ml-auto flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                {showReplyButton && (
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground h-auto px-1.5 py-0.5 text-xs"
                    >
                      <Archive className="size-3 sm:mr-1" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove this insight?</DialogTitle>
                      <DialogDescription>
                        This insight will be archived and hidden from the page.
                        Admins can restore it later.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleArchive}
                        disabled={isPending}
                      >
                        Remove
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
}
