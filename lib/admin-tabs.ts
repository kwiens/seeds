export const adminTabValues = [
  "seeds",
  "insights",
  "export",
  "users",
  "harvestFest",
  "settings",
] as const;

export type AdminTab = (typeof adminTabValues)[number];

export function isAdminTab(value: string | undefined): value is AdminTab {
  return adminTabValues.some((tab) => tab === value);
}
