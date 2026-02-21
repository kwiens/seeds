"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Archive,
  CheckCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { approveSeed, archiveSeed } from "@/lib/actions/admin";

export function SeedActions({
  seedId,
  status,
}: {
  seedId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "pending" && (
          <DropdownMenuItem
            onClick={() => startTransition(async () => { await approveSeed(seedId); })}
          >
            <CheckCircle className="mr-2 size-4 text-green-600" />
            Approve
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={`/seeds/${seedId}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        {status !== "archived" && (
          <DropdownMenuItem
            onClick={() => startTransition(async () => { await archiveSeed(seedId); })}
          >
            <Archive className="mr-2 size-4" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            if (confirm("Are you sure you want to archive this seed?")) {
              startTransition(async () => { await archiveSeed(seedId); });
            }
          }}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
