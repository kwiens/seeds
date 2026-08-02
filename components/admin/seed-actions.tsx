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
  approveProject,
  archiveProject,
  unapproveProject,
  unarchiveProject,
  advanceToSprout,
  advanceToTree,
  revertToSeed,
  revertToSprout,
  setProjectBadges,
} from "@/lib/actions/admin";
import { badges, badgeKeys, type BadgeKey } from "@/lib/badges";

export function SeedActions({
  projectId,
  stage,
  approvalState,
  archived,
  badges: activeBadges,
  creatorEmail,
  supporterEmails,
}: {
  projectId: string;
  stage: "seed" | "sprout" | "tree";
  approvalState: "draft" | "pending" | "approved";
  archived: boolean;
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
      await setProjectBadges(projectId, next as BadgeKey[]);
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
        {stage === "seed" && approvalState === "pending" && !archived && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await approveProject(projectId);
              })
            }
          >
            <CheckCircle className="mr-2 size-4 text-green-600" />
            Approve
          </DropdownMenuItem>
        )}
        {stage === "seed" && approvalState === "approved" && !archived && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await advanceToSprout(projectId);
              })
            }
          >
            <ArrowUp className="mr-2 size-4 text-green-600" />
            Advance to Sprout
          </DropdownMenuItem>
        )}
        {stage === "sprout" && !archived && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await advanceToTree(projectId);
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
          <Link href={`/seeds/${projectId}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/seeds/${projectId}/qr`}
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
        {approvalState === "approved" && !archived && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await unapproveProject(projectId);
              })
            }
          >
            <XCircle className="mr-2 size-4 text-amber-600" />
            Unapprove
          </DropdownMenuItem>
        )}
        {stage === "sprout" && !archived && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await revertToSeed(projectId);
              })
            }
          >
            <ArrowDown className="mr-2 size-4 text-amber-600" />
            Revert to Seed
          </DropdownMenuItem>
        )}
        {stage === "tree" && !archived && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await revertToSprout(projectId);
              })
            }
          >
            <ArrowDown className="mr-2 size-4 text-amber-600" />
            Revert to Sprout
          </DropdownMenuItem>
        )}

        {!archived && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await archiveProject(projectId);
              })
            }
          >
            <Archive className="mr-2 size-4" />
            Archive
          </DropdownMenuItem>
        )}
        {archived && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await unarchiveProject(projectId);
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
