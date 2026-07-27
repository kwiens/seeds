"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTeamMember, removeTeamMember } from "@/lib/actions/team-roster";
import type { RosterMember } from "@/lib/db/queries/team-roster";
import { teamRoleKeys, teamRoleLabels, type TeamRole } from "@/lib/team-roles";

export function TeamRoster({
  seedId,
  members,
  canManage,
  isAdmin,
}: {
  seedId: string;
  members: RosterMember[];
  canManage: boolean;
  isAdmin: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 text-sm font-semibold">Team ({members.length})</h4>
      <div className="space-y-3">
        {members.map((member) => (
          <RosterRow
            key={member.userId}
            member={member}
            seedId={seedId}
            canManage={canManage}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {canManage &&
        (showAdd ? (
          <AddMemberForm
            seedId={seedId}
            isAdmin={isAdmin}
            onDone={() => setShowAdd(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-muted-foreground hover:border-primary hover:text-foreground mt-3 w-full rounded-md border border-dashed px-3 py-2 text-sm"
          >
            + Add to team
          </button>
        ))}
    </div>
  );
}

function RosterRow({
  member,
  seedId,
  canManage,
  isAdmin,
}: {
  member: RosterMember;
  seedId: string;
  canManage: boolean;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isGardener = member.roleLabel === "Gardener";
  const canRemove =
    !isGardener &&
    (member.roleLabel === teamRoleLabels.steward ? isAdmin : canManage);

  function handleRemove() {
    startTransition(async () => {
      await removeTeamMember(seedId, member.userId);
    });
  }

  return (
    <div className="group flex items-center gap-3">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={member.image ?? undefined} />
        <AvatarFallback className="text-xs">
          {member.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {member.roleLabel}
          {member.addedByName && ` · added by ${member.addedByName}`}
        </p>
      </div>
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          onClick={handleRemove}
          className="opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="text-muted-foreground size-3.5" />
        </Button>
      )}
    </div>
  );
}

function AddMemberForm({
  seedId,
  isAdmin,
  onDone,
}: {
  seedId: string;
  isAdmin: boolean;
  onDone: () => void;
}) {
  const availableRoles = isAdmin
    ? teamRoleKeys
    : teamRoleKeys.filter((r) => r !== "steward");

  const [role, setRole] = useState<TeamRole>(availableRoles[0]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const targetEmail = email.trim();
    if (!targetEmail) return;

    setError(null);
    startTransition(async () => {
      const result = await addTeamMember(seedId, targetEmail, role);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border p-3">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-2 py-1.5 text-xs">
          {error}
        </p>
      )}

      <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((r) => (
            <SelectItem key={r} value={r}>
              {teamRoleLabels[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending || !email.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
