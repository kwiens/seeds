import { teamRoleLabels } from "@/lib/team-roles";

const ROLE_DESCRIPTIONS: { label: string; description: string }[] = [
  { label: "Gardener", description: "Owns this Sprout's public listing." },
  {
    label: teamRoleLabels.co_gardener,
    description: "A second person sharing the day-to-day work.",
  },
  {
    label: teamRoleLabels.guide,
    description: "A mentor or expert actively advising on this Sprout.",
  },
  {
    label: teamRoleLabels.roots,
    description:
      "A real contact from one of the organizations connected to this Sprout, who is actively working on it.",
  },
  {
    label: teamRoleLabels.steward,
    description:
      "Someone from the city or county assigned to help this specific Sprout move forward.",
  },
  {
    label: teamRoleLabels.cultivator,
    description: "A community member actively pitching in with hands-on work.",
  },
];

export function TeamRolesExplainer() {
  return (
    <details className="group rounded-lg border p-4">
      <summary className="text-sm font-semibold">
        What do these roles mean?
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-muted-foreground text-xs">
          Add someone here once they&apos;re actively working on this Sprout.
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
        <p className="text-muted-foreground text-xs">
          You may also see a <span className="font-semibold">Council</span>{" "}
          badge on someone&apos;s post here — they&apos;re a trusted, site-wide
          contact who can view and comment on any Sprout, even ones they&apos;re
          not on the team for.
        </p>
      </div>
    </details>
  );
}
