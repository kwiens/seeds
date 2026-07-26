import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RosterMember } from "@/lib/db/queries/team-roster";

export function TeamRoster({ members }: { members: RosterMember[] }) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 text-sm font-semibold">Team ({members.length})</h4>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.userId} className="flex items-center gap-3">
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
          </div>
        ))}
      </div>
    </div>
  );
}
