import type { NewProjectParticipant } from "@/lib/db/types";
import type { ProjectFormValues } from "@/lib/validations/project";

type ParticipantInput = Pick<
  NewProjectParticipant,
  "displayName" | "role" | "state"
>;

type FormParticipantRole = "gardener" | "roots" | "guide";
type ExcludedNamesByRole = Partial<Record<FormParticipantRole, string[]>>;

function normalizedUniqueNames(names: string[], excludedNames: string[]) {
  const excluded = new Set(
    excludedNames.map((name) => name.trim().toLocaleLowerCase()),
  );
  const seen = new Set<string>();

  return names.flatMap((name) => {
    const displayName = name.trim();
    const key = displayName.toLocaleLowerCase();
    if (!displayName || excluded.has(key) || seen.has(key)) return [];
    seen.add(key);
    return [displayName];
  });
}

export function formParticipantInputs(
  values: Pick<ProjectFormValues, "gardeners" | "roots" | "supportPeople">,
  excludedNames: ExcludedNamesByRole = {},
): ParticipantInput[] {
  const gardeners = normalizedUniqueNames(
    values.gardeners,
    excludedNames.gardener ?? [],
  ).map((displayName) => ({
    displayName,
    role: "gardener" as const,
    state: "active" as const,
  }));
  const roots = normalizedUniqueNames(
    values.roots.map((root) => root.name),
    excludedNames.roots ?? [],
  ).map((displayName) => {
    const root = values.roots.find(
      (item) =>
        item.name.trim().toLocaleLowerCase() ===
        displayName.toLocaleLowerCase(),
    );
    return {
      displayName,
      role: "roots" as const,
      state: root?.committed ? ("active" as const) : ("prospective" as const),
    };
  });
  const guides = normalizedUniqueNames(
    values.supportPeople,
    excludedNames.guide ?? [],
  ).map((displayName) => ({
    displayName,
    role: "guide" as const,
    state: "prospective" as const,
  }));

  return [...gardeners, ...roots, ...guides];
}
