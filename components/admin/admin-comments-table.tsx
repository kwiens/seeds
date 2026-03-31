"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { archiveComment, unarchiveComment } from "@/lib/actions/comments";

interface AdminComment {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  archivedAt: Date | null;
  seedId: string;
  seedName: string;
  userName: string;
}

function ActionButton({ comment }: { comment: AdminComment }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      if (comment.archivedAt) {
        await unarchiveComment(comment.id);
      } else {
        await archiveComment(comment.id);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="h-auto px-2 py-1"
    >
      {comment.archivedAt ? (
        <>
          <ArchiveRestore className="mr-1 size-3.5" />
          Restore
        </>
      ) : (
        <>
          <Archive className="mr-1 size-3.5" />
          Archive
        </>
      )}
    </Button>
  );
}

export function AdminCommentsTable({ comments }: { comments: AdminComment[] }) {
  if (comments.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No community insights yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Seed</TableHead>
            <TableHead>Author</TableHead>
            <TableHead className="min-w-[200px]">Content</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((comment) => (
            <TableRow
              key={comment.id}
              className={comment.archivedAt ? "opacity-50" : ""}
            >
              <TableCell>
                <Link
                  href={`/seeds/${comment.seedId}`}
                  className="text-sm font-medium hover:underline"
                >
                  {comment.seedName}
                </Link>
              </TableCell>
              <TableCell className="text-sm">{comment.userName}</TableCell>
              <TableCell>
                <p className="max-w-[300px] truncate text-sm">
                  {comment.content}
                </p>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {comment.parentId ? "Reply" : "Insight"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {comment.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell>
                {comment.archivedAt ? (
                  <Badge variant="secondary" className="text-xs">
                    Archived
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                  >
                    Visible
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <ActionButton comment={comment} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
