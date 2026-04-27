"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, login as loginRequest, logout as logoutRequest, type AuthUser } from "./lib/auth";
import { roleHasPermission, type AegisPermission } from "./lib/rbac";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: AegisPermission) => boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const publicRoutes = ["/", "/pilot", "/login"];

function requiredPermission(pathname: string): AegisPermission | null {
  if (pathname === "/cases/new") return "create_intake";
  if (pathname === "/reporting") return "view_reporting";
  if (pathname === "/ops" || (pathname.startsWith("/cases/") && pathname !== "/cases/new")) return "view_cases";
  return null;
}

function isPublicRoute(pathname: string) {
  return publicRoutes.includes(pathname);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const result = await getCurrentUser();
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshUser();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async login(email, password) {
        const result = await loginRequest(email, password);
        setUser(result.user);
      },
      async logout() {
        await logoutRequest();
        setUser(null);
      },
      can(permission) {
        return user ? roleHasPermission(user.role, permission) : false;
      },
      refreshUser,
    }),
    [user, isLoading, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const permission = requiredPermission(pathname);

  useEffect(() => {
    if (auth.isLoading || auth.user || isPublicRoute(pathname)) return;
    const redirect = encodeURIComponent(pathname);
    router.replace(`/login?redirect=${redirect}`);
  }, [auth.isLoading, auth.user, pathname, router]);

  if (isPublicRoute(pathname)) return children;

  if (auth.isLoading) {
    return (
      <main className="page-wrap workspace-shell">
        <div className="ops-inline-banner">Checking session...</div>
      </main>
    );
  }

  if (!auth.user) {
    return (
      <main className="page-wrap workspace-shell">
        <div className="system-state-panel">
          <div>
            <div className="system-state-kicker">Authentication required</div>
            <h3>Redirecting to sign in</h3>
            <p>Sign in with a demo account to continue.</p>
          </div>
        </div>
      </main>
    );
  }

  if (permission && !roleHasPermission(auth.user.role, permission)) {
    return (
      <main className="page-wrap workspace-shell">
        <div className="system-state-panel">
          <div>
            <div className="system-state-kicker">Access restricted</div>
            <h3>This role cannot access this workspace</h3>
            <p>Your current role is {auth.user.role.replace(/_/g, " ")}.</p>
          </div>
        </div>
      </main>
    );
  }

  return children;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
