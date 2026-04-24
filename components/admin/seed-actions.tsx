"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Mail,
  MoreHorizontal,
  Pencil,
  QrCode,
  Tag,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  approveSeed,
  archiveSeed,
  unapproveSeed,
  unarchiveSeed,
  advanceToInProgress,
  advanceToMaintenance,
  revertToApproved,
  revertToInProgress,
  setSeedBadges,
} from "@/lib/actions/admin";
import { badges, badgeKeys, type BadgeKey } from "@/lib/badges";

export function SeedActions({
  seedId,
  status,
  badges: activeBadges,
  creatorEmail,
  supporterEmails,
}: {
  seedId: string;
  status: string;
  badges: string[];
  creatorEmail: string;
  supporterEmails?: string[];
}) {
  const [isPending, startTransition] = useTransition();

  function toggleBadge(key: BadgeKey) {
    const next = activeBadges.includes(key)
      ? activeBadges.filter((b) => b !== key)
      : [
          ...activeBadges.filter((b): b is BadgeKey =>
            (badgeKeys as string[]).includes(b),
          ),
          key,
        ];
    startTransition(async () => {
      await setSeedBadges(seedId, next as BadgeKey[]);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Forward transitions */}
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
        {status === "approved" && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await advanceToInProgress(seedId);
              })
            }
          >
            <ArrowUp className="mr-2 size-4 text-green-600" />
            Advance to Sprout
          </DropdownMenuItem>
        )}
        {status === "in_progress" && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await advanceToMaintenance(seedId);
              })
            }
          >
            <ArrowUp className="mr-2 size-4 text-green-600" />
            Advance to Tree
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Standard actions */}
        <DropdownMenuItem asChild>
          <Link href={`/seeds/${seedId}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/seeds/${seedId}/qr`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <QrCode className="mr-2 size-4" />
            QR Code
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`mailto:${[creatorEmail, ...(supporterEmails ?? [])].filter((v, i, a) => a.indexOf(v) === i).join(",")}`}
          >
            <Mail className="mr-2 size-4" />
            Email{supporterEmails?.length ? " Team" : " Creator"}
          </a>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tag className="mr-2 size-4" />
            Badges
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {badgeKeys.map((key) => {
              const info = badges[key];
              const Icon = info.icon;
              return (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={activeBadges.includes(key)}
                  onSelect={(e) => {
                    // Prevent the parent menu from closing on each toggle
                    e.preventDefault();
                    toggleBadge(key);
                  }}
                  disabled={isPending}
                >
                  <Icon className="mr-2 size-3.5" />
                  {info.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Backward transitions */}
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
        {status === "in_progress" && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await revertToApproved(seedId);
              })
            }
          >
            <ArrowDown className="mr-2 size-4 text-amber-600" />
            Revert to Seed
          </DropdownMenuItem>
        )}
        {status === "in_maintenance" && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await revertToInProgress(seedId);
              })
            }
          >
            <ArrowDown className="mr-2 size-4 text-amber-600" />
            Revert to Sprout
          </DropdownMenuItem>
        )}

        {/* Archive/Unarchive — archive only from seed stage to keep unarchive
            lossless. Revert sprouts/trees back to Seed first if needed. */}
        {(status === "pending" || status === "approved") && (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
