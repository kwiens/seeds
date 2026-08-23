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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
              <PendingInviteRow key={invite.id} invite={invite} />
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

function PendingInviteRow({ invite }: { invite: PendingInvite }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!invite.link) return;
    setError(null);
    try {
      const link = new URL(invite.link, window.location.origin).toString();
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy the invite link. Try again.");
    }
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await cancelInvite(invite.id);
        if (result.error) setError(result.error);
      } catch {
        setError("Could not cancel this invite. Try again.");
      }
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
      {invite.link && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          aria-label={`Copy invite link for ${invite.invitedName}`}
        >
          <Copy className="text-muted-foreground size-3.5" />
        </Button>
      )}
      {invite.link && (
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
        <p role="status" className="text-muted-foreground w-full pl-11 text-xs">
          Copied.
        </p>
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
  const [role, setRole] = useState<TeamRole>("member");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<{
    link: string;
    invitedName: string;
    roleLabel: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEmail = mode === "email";

  function handleModeChange(value: string) {
    setMode(value as typeof mode);
    setRole("member");
    setTarget("");
    setError(null);
    setGeneratedInvite(null);
    setCopied(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedTarget = target.trim();
    if (!submittedTarget) return;
    const submittedMode = mode;
    const submittedRole = role;

    setError(null);
    startTransition(async () => {
      try {
        const result =
          submittedMode === "email"
            ? await addTeamMember(seedId, submittedTarget, submittedRole)
            : await createInvite(seedId, submittedTarget, submittedRole);

        if ("error" in result && result.error) {
          setError(result.error);
        } else if ("link" in result) {
          setGeneratedInvite({
            link: result.link,
            invitedName: submittedTarget,
            roleLabel: teamRoleLabels[submittedRole],
          });
        } else {
          onDone();
        }
      } catch {
        setError(
          submittedMode === "email"
            ? "Could not add this person. Try again."
            : "Could not generate the invite link. Try again.",
        );
      }
    });
  }

  async function handleCopy() {
    if (!generatedInvite) return;
    try {
      await navigator.clipboard.writeText(generatedInvite.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy the invite link. Try again.");
    }
  }

  return (
    <Tabs
      value={mode}
      onValueChange={handleModeChange}
      className="mt-3 rounded-md border p-3"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="email" disabled={isPending || !!generatedInvite}>
          <Mail className="size-3.5" />
          Add by email
        </TabsTrigger>
        <TabsTrigger value="link" disabled={isPending || !!generatedInvite}>
          <Link2 className="size-3.5" />
          Invite by link
        </TabsTrigger>
      </TabsList>
      <TabsContent value={mode} className="mt-2">
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-muted-foreground text-xs">
            {isEmail
              ? "For people who've already signed into the site before."
              : "Works even if they've never signed in — they'll sign in with Google when they click it, then confirm joining."}
          </p>
          {error && (
            <p
              role="alert"
              className="bg-destructive/10 text-destructive rounded-md px-2 py-1.5 text-xs"
            >
              {error}
            </p>
          )}

          {generatedInvite ? (
            <div className="bg-muted space-y-1.5 rounded-md p-2">
              <p role="status" className="break-words text-xs font-medium">
                Invite link for {generatedInvite.invitedName}
              </p>
              <p className="text-muted-foreground text-xs">
                {generatedInvite.roleLabel}
              </p>
              <div className="flex gap-1.5">
                <Input
                  value={generatedInvite.link}
                  readOnly
                  aria-label={`Invite link for ${generatedInvite.invitedName}`}
                  className="font-mono text-base md:text-sm"
                />
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
              {copied && (
                <p role="status" className="text-muted-foreground text-xs">
                  Copied.
                </p>
              )}
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={onDone}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              <TeamRoleSelect
                role={role}
                isAdmin={isAdmin}
                disabled={isPending}
                onChange={setRole}
              />

              <Input
                type={isEmail ? "email" : "text"}
                value={target}
                disabled={isPending}
                onChange={(event) => setTarget(event.target.value)}
                placeholder={
                  isEmail
                    ? "email@example.com"
                    : "Their name (so you can tell links apart)"
                }
                aria-label={
                  isEmail
                    ? "Email address of person to add"
                    : "Name of person being invited"
                }
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={onDone}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !target.trim()}
                >
                  {isPending
                    ? isEmail
                      ? "Adding…"
                      : "Generating…"
                    : isEmail
                      ? "Add"
                      : "Generate invite link"}
                </Button>
              </div>
            </>
          )}
        </form>
      </TabsContent>
    </Tabs>
  );
}

function TeamRoleSelect({
  role,
  isAdmin,
  disabled = false,
  onChange,
}: {
  role: TeamRole;
  isAdmin: boolean;
  disabled?: boolean;
  onChange: (role: TeamRole) => void;
}) {
  const roles = isAdmin
    ? teamRoleKeys
    : teamRoleKeys.filter((item) => item !== "steward");

  return (
    <Select
      value={role}
      disabled={disabled}
      onValueChange={(value) => onChange(value as TeamRole)}
    >
      <SelectTrigger className="w-full" aria-label="Team role">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((item) => (
          <SelectItem key={item} value={item}>
            {teamRoleLabels[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
