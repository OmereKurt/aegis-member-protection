export const aegisRoles = [
  "branch_user",
  "fraud_analyst",
  "manager",
  "admin",
] as const;

export type AegisRole = (typeof aegisRoles)[number];

export const aegisPermissions = [
  "create_intake",
  "update_case",
  "close_case",
  "view_reporting",
  "manage_demo_data",
] as const;

export type AegisPermission = (typeof aegisPermissions)[number];

export const rolePermissions: Record<AegisRole, AegisPermission[]> = {
  branch_user: ["create_intake"],
  fraud_analyst: ["update_case", "close_case"],
  manager: ["view_reporting"],
  admin: [...aegisPermissions],
};

export function roleHasPermission(role: AegisRole, permission: AegisPermission) {
  return rolePermissions[role].includes(permission);
}
