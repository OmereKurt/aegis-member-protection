import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  aegisPermissions,
  aegisRoles,
  rolePermissions,
  roleHasPermission,
  type AegisPermission,
  type AegisRole,
} from "../app/lib/rbac";

/**
 * The frontend keeps its own copy of the permission matrix so it can hide
 * actions a role cannot take. The backend enforces the real one in
 * app/core/security.py. Nothing links the two, so they can drift silently, and
 * drift is not cosmetic in either direction:
 *
 *   frontend grants more -> the UI offers a button the API answers with 403
 *   frontend grants less -> a role quietly loses access it is entitled to
 *
 * These tests read the backend source and compare. If someone edits one matrix
 * and not the other, this fails and names the role.
 */

const SECURITY_PY = join(__dirname, "..", "..", "backend", "app", "core", "security.py");

function backendSource(): string {
  // Normalise line endings: a Windows checkout gives CRLF, and every pattern
  // below would otherwise have to account for it.
  return readFileSync(SECURITY_PY, "utf8").replace(/\r\n/g, "\n");
}

/**
 * Pull the members of a python Enum class into a list of their names.
 *
 * Line-based rather than one regex over the whole body: a class ends at the
 * first non-indented, non-blank line, which does not depend on how many blank
 * lines the formatter happened to leave.
 */
function parseEnumMembers(source: string, className: string): string[] {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`class ${className}(str, Enum):`));
  if (start === -1) throw new Error(`could not find enum ${className} in security.py`);

  const members: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") continue;
    if (!/^\s/.test(line)) break;

    const member = line.match(/^\s+(\w+)\s*=/);
    if (member) members.push(member[1]);
  }

  if (members.length === 0) throw new Error(`enum ${className} parsed as empty`);
  return members;
}

/** Parse ROLE_PERMISSIONS into { role: [permission, ...] }. */
function parseBackendMatrix(source: string): Record<string, string[]> {
  const allPermissions = parseEnumMembers(source, "Permission");

  const block = source.match(/ROLE_PERMISSIONS[^=]*=\s*\{([\s\S]*?)\n\}/m);
  if (!block) throw new Error("could not find ROLE_PERMISSIONS in security.py");

  const matrix: Record<string, string[]> = {};

  // Each entry is either `AegisRole.x: {Permission.a, Permission.b}` or the
  // shorthand `AegisRole.admin: set(Permission)` meaning every permission.
  const entries = block[1].matchAll(
    /AegisRole\.(\w+)\s*:\s*(set\(Permission\)|\{[\s\S]*?\})/g
  );

  for (const [, role, value] of entries) {
    matrix[role] =
      value === "set(Permission)"
        ? [...allPermissions]
        : [...value.matchAll(/Permission\.(\w+)/g)].map((m) => m[1]);
  }

  return matrix;
}

describe("the backend source can still be parsed", () => {
  // If the backend is refactored so these patterns stop matching, the parity
  // tests below would silently pass against an empty matrix. Fail loudly first.
  it("finds both enums and the matrix", () => {
    const source = backendSource();
    expect(parseEnumMembers(source, "AegisRole").length).toBeGreaterThan(0);
    expect(parseEnumMembers(source, "Permission").length).toBeGreaterThan(0);
    expect(Object.keys(parseBackendMatrix(source)).length).toBeGreaterThan(0);
  });
});

describe("frontend RBAC matches the backend it is mirroring", () => {
  it("declares the same roles", () => {
    expect([...aegisRoles].sort()).toEqual(parseEnumMembers(backendSource(), "AegisRole").sort());
  });

  it("declares the same permissions", () => {
    expect([...aegisPermissions].sort()).toEqual(
      parseEnumMembers(backendSource(), "Permission").sort()
    );
  });

  it("grants each role exactly what the backend grants it", () => {
    const backend = parseBackendMatrix(backendSource());

    for (const role of aegisRoles) {
      expect(backend[role], `backend has no entry for ${role}`).toBeDefined();
      expect([...rolePermissions[role]].sort(), `permissions differ for ${role}`).toEqual(
        [...backend[role]].sort()
      );
    }
  });

  it("covers every backend role, with no extras on either side", () => {
    const backend = parseBackendMatrix(backendSource());
    expect(Object.keys(backend).sort()).toEqual([...aegisRoles].sort());
  });
});

describe("roleHasPermission", () => {
  it("answers from the table", () => {
    expect(roleHasPermission("branch_user", "create_intake")).toBe(true);
    expect(roleHasPermission("branch_user", "view_cases")).toBe(true);
  });

  it("refuses what a role does not hold", () => {
    // A branch user filing intake must not be able to close the case they filed.
    expect(roleHasPermission("branch_user", "close_case")).toBe(false);
    expect(roleHasPermission("branch_user", "view_reporting")).toBe(false);
    expect(roleHasPermission("branch_user", "manage_demo_data")).toBe(false);
  });

  it("gives admin everything", () => {
    for (const permission of aegisPermissions) {
      expect(roleHasPermission("admin", permission), permission).toBe(true);
    }
  });

  it("keeps manager read-only over cases", () => {
    // A manager reports on the queue but does not work it.
    expect(roleHasPermission("manager", "view_cases")).toBe(true);
    expect(roleHasPermission("manager", "view_reporting")).toBe(true);
    expect(roleHasPermission("manager", "update_case")).toBe(false);
    expect(roleHasPermission("manager", "close_case")).toBe(false);
    expect(roleHasPermission("manager", "create_intake")).toBe(false);
  });

  it("restricts demo data management to admin alone", () => {
    const holders = aegisRoles.filter((role) => roleHasPermission(role, "manage_demo_data"));
    expect(holders).toEqual(["admin"]);
  });

  it("has an entry for every role, so no lookup can throw", () => {
    for (const role of aegisRoles) {
      expect(rolePermissions[role], role).toBeInstanceOf(Array);
    }
  });

  it("never grants a permission outside the declared list", () => {
    const declared = new Set<AegisPermission>(aegisPermissions);
    for (const role of aegisRoles as readonly AegisRole[]) {
      for (const permission of rolePermissions[role]) {
        expect(declared.has(permission), `${role} holds unknown permission ${permission}`).toBe(
          true
        );
      }
    }
  });
});
