"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Copy, Link2, Mail, Trash2, X } from "lucide-react";
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
import { cancelInvite, createInvite } from "@/lib/actions/invites";
import type { RosterMember } from "@/lib/db/queries/team-roster";
import type { PendingInvite } from "@/lib/db/queries/invites";
import {
  teamRoleKeys,
  teamRoleLabels,
  type TeamRole,
} from "@/lib/participant-roles";

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
  pendingInvites,
  canManage,
  isAdmin,
}: {
  seedId: string;
  members: RosterMember[];
  pendingInvites: PendingInvite[];
  canManage: boolean;
  isAdmin: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Team ({members.length})</h3>
        <button
          type="button"
          onClick={() => setShowExplainer(!showExplainer)}
          aria-expanded={showExplainer}
          aria-controls="team-roles-explainer"
          className="text-muted-foreground hover:text-foreground -my-1.5 py-1.5 text-xs font-medium"
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

      {pendingInvites.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Pending invites ({pendingInvites.length})
          </p>
          <div className="space-y-2.5">
            {pendingInvites.map((invite) => (
              <PendingInviteRow
                key={invite.id}
                invite={invite}
                canManage={canManage}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      )}

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
        <div id="team-roles-explainer" className="mt-4 space-y-3 border-t pt-3">
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
  const isGardener = member.roleLabels.includes("Gardener");
  const canRemove =
    !isGardener &&
    (member.roleLabels.includes(teamRoleLabels.steward) ? isAdmin : canManage);

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
        <AvatarImage src={member.image ?? undefined} alt="" />
        <AvatarFallback className="text-xs">
          {member.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {member.roleLabels.join(", ")}
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
        <p role="alert" className="text-destructive w-full pl-11 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

function PendingInviteRow({
  invite,
  canManage,
  isAdmin,
}: {
  invite: PendingInvite;
  canManage: boolean;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canCancel = invite.role === "steward" ? isAdmin : canManage;

  async function handleCopy() {
    const link = `${window.location.origin}/invite/${invite.token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked in some browser contexts; the link
      // is still visible to select and copy manually if this silently no-ops.
    }
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelInvite(invite.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Avatar className="size-8 shrink-0 opacity-60">
        <AvatarFallback className="text-xs">
          {invite.invitedName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{invite.invitedName}</p>
        <p className="text-muted-foreground truncate text-xs">
          {invite.roleLabel} · invited
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label={`Copy invite link for ${invite.invitedName}`}
      >
        <Copy className="text-muted-foreground size-3.5" />
      </Button>
      {canCancel && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isPending}
          onClick={handleCancel}
          aria-label={`Cancel invite for ${invite.invitedName}`}
        >
          <X className="text-muted-foreground size-3.5" />
        </Button>
      )}
      {copied && (
        <p className="text-muted-foreground w-full pl-11 text-xs">Copied.</p>
      )}
      {error && (
        <p role="alert" className="text-destructive w-full pl-11 text-xs">
          {error}
        </p>
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
  const [mode, setMode] = useState<"email" | "link">("email");

  return (
    <div className="mt-3 space-y-2 rounded-md border p-3">
      <div className="bg-muted flex gap-1 rounded-md p-1 text-xs">
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 font-medium ${
            mode === "email"
              ? "bg-background shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Mail className="size-3.5" />
          Add by email
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 font-medium ${
            mode === "link"
              ? "bg-background shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Link2 className="size-3.5" />
          Invite by link
        </button>
      </div>

      {mode === "email" ? (
        <AddByEmailForm seedId={seedId} isAdmin={isAdmin} onDone={onDone} />
      ) : (
        <InviteByLinkForm seedId={seedId} isAdmin={isAdmin} onDone={onDone} />
      )}
    </div>
  );
}

function AddByEmailForm({
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-muted-foreground text-xs">
        For people who&apos;ve already signed into the site before.
      </p>
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-2 py-1.5 text-xs"
        >
          {error}
        </p>
      )}

      <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
        <SelectTrigger className="w-full" aria-label="Team role">
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
        aria-label="Email address of person to add"
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !email.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
}

function InviteByLinkForm({
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
  const [invitedName, setInvitedName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    const name = invitedName.trim();
    if (!name) return;

    setError(null);
    startTransition(async () => {
      const result = await createInvite(seedId, name, role);
      if ("link" in result) {
        setLink(result.link);
      } else {
        setError(result.error);
      }
    });
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Silently no-op; the link is still visible to copy manually.
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        Works even if they&apos;ve never signed in — they&apos;ll sign in with
        Google when they click it, then confirm joining.
      </p>
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-2 py-1.5 text-xs"
        >
          {error}
        </p>
      )}

      <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
        <SelectTrigger className="w-full" aria-label="Team role">
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
        value={invitedName}
        onChange={(e) => setInvitedName(e.target.value)}
        placeholder="Their name (so you can tell links apart)"
        aria-label="Name of person being invited"
      />

      {link ? (
        <div className="space-y-1.5 rounded-md bg-muted p-2">
          <p className="text-xs font-medium">Invite link for {invitedName}</p>
          <div className="flex gap-1.5">
            <Input value={link} readOnly className="font-mono text-xs" />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0"
              onClick={handleCopy}
              aria-label="Copy invite link"
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
          {copied && <p className="text-muted-foreground text-xs">Copied.</p>}
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={onDone}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onDone}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending || !invitedName.trim()}
            onClick={handleGenerate}
          >
            Generate invite link
          </Button>
        </div>
      )}
    </div>
  );
}
