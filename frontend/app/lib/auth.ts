import { apiUrl, fetchJson } from "./api";
import type { AegisRole } from "./rbac";

export type AuthUser = {
  id: number;
  email: string;
  display_name: string;
  role: AegisRole;
};

export function getCurrentUser() {
  return fetchJson<{ user: AuthUser }>(apiUrl("/api/auth/me"));
}

export function login(email: string, password: string) {
  return fetchJson<{ user: AuthUser }>(apiUrl("/api/auth/login"), {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return fetchJson<{ ok: boolean }>(apiUrl("/api/auth/logout"), {
    method: "POST",
  });
}
