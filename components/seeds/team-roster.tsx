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

const ROLE_DESCRIPTIONS: { label: string; description: string }[] = [
  {
    label: "Gardener",
    description: "Leads the Sprout and manages its public page.",
  },
  {
    label: teamRoleLabels.co_gardener,
    description: "Shares responsibility for leading the Sprout.",
  },
  {
    label: teamRoleLabels.guide,
    description: "Provides mentorship, expertise, and advice.",
  },
  {
    label: teamRoleLabels.roots,
    description:
      "Represents a partner organization actively supporting this Sprout.",
  },
  {
    label: teamRoleLabels.steward,
    description: "Helps navigate city or county processes and approvals.",
  },
  {
    label: teamRoleLabels.cultivator,
    description:
      "Actively volunteers time and skills to help the Sprout succeed.",
  },
  {
    label: "Council (badge only)",
    description:
      "A trusted platform-wide advisor who can view and comment on any Sprout, even if they're not part of its team.",
  },
];

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
  const [showExplainer, setShowExplainer] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Team ({members.length})</h4>
        <button
          type="button"
          onClick={() => setShowExplainer(!showExplainer)}
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          What do these roles mean?
        </button>
      </div>
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

      {showExplainer && (
        <div className="mt-4 space-y-3 border-t pt-3">
          <p className="text-sm font-semibold">Team Roles</p>
          <p className="text-muted-foreground text-xs">
            Add someone here once they&apos;re actively helping this Sprout
            grow.
          </p>
          <dl className="space-y-2">
            {ROLE_DESCRIPTIONS.map((role) => (
              <div key={role.label}>
                <dt className="text-xs font-semibold">{role.label}</dt>
                <dd className="text-muted-foreground text-xs">
                  {role.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
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
  const [error, setError] = useState<string | null>(null);
  const isGardener = member.roleLabel === "Gardener";
  const canRemove =
    !isGardener &&
    (member.roleLabel === teamRoleLabels.steward ? isAdmin : canManage);

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeTeamMember(seedId, member.userId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="group flex flex-wrap items-center gap-3">
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
          aria-label={`Remove ${member.name} from team`}
          className="sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
        >
          <Trash2 className="text-muted-foreground size-3.5" />
        </Button>
      )}
      {error && (
        <p className="text-destructive w-full pl-11 text-xs">{error}</p>
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
