"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  CheckCircle,
  Mail,
  MoreHorizontal,
  Pencil,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  approveSeed,
  archiveSeed,
  unapproveSeed,
  unarchiveSeed,
} from "@/lib/actions/admin";

export function SeedActions({
  seedId,
  status,
  supporterEmails,
}: {
  seedId: string;
  status: string;
  supporterEmails?: string[];
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
            onClick={() =>
              startTransition(async () => {
                await approveSeed(seedId);
              })
            }
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
        {supporterEmails && supporterEmails.length > 0 && (
          <DropdownMenuItem asChild>
            <a href={`mailto:${supporterEmails.join(",")}`}>
              <Mail className="mr-2 size-4" />
              Email Supporters
            </a>
          </DropdownMenuItem>
        )}
        {status !== "archived" && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await archiveSeed(seedId);
              })
            }
          >
            <Archive className="mr-2 size-4" />
            Archive
          </DropdownMenuItem>
        )}
        {status === "archived" && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await unarchiveSeed(seedId);
              })
            }
          >
            <ArchiveRestore className="mr-2 size-4 text-green-600" />
            Unarchive
          </DropdownMenuItem>
        )}
        {status === "approved" && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await unapproveSeed(seedId);
              })
            }
          >
            <XCircle className="mr-2 size-4 text-amber-600" />
            Unapprove
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
