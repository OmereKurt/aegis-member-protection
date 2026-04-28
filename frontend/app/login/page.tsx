"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";

const demoUsers = [
  { role: "Branch user", email: "branch@aegis.local", password: "AegisBranch123!" },
  { role: "Fraud analyst", email: "fraud@aegis.local", password: "AegisFraud123!" },
  { role: "Manager", email: "manager@aegis.local", password: "AegisManager123!" },
  { role: "Admin", email: "admin@aegis.local", password: "AegisAdmin123!" },
];

function redirectTarget() {
  if (typeof window === "undefined") return "/ops";
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect && redirect.startsWith("/") ? redirect : "/ops";
}

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("fraud@aegis.local");
  const [password, setPassword] = useState("AegisFraud123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && auth.user) {
      router.replace(redirectTarget());
    }
  }, [auth.isLoading, auth.user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await auth.login(email, password);
      router.replace(redirectTarget());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-wrap login-page workspace-shell">
      <section className="login-console-grid">
        <div className="console-panel login-panel">
          <div className="page-kicker">Aegis access</div>
          <h1>Sign in to the member protection console</h1>
          <p className="page-subtitle">
            Use a local demo account to access Operations, Intake, Reporting, and case workspaces.
          </p>
          <div className="login-security-strip">
            <span>HttpOnly session</span>
            <span>Role-based access</span>
            <span>CSRF-protected actions</span>
          </div>

          {error ? <div className="ops-inline-banner">{error}</div> : null}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="field-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <aside className="inspector-panel login-demo-panel">
          <div className="page-kicker">Local demo users</div>
          <h2>Role-based access examples</h2>
          <div className="reporting-list">
            {demoUsers.map((user) => (
              <button
                type="button"
                className="reporting-row demo-user-row"
                key={user.email}
                onClick={() => {
                  setEmail(user.email);
                  setPassword(user.password);
                }}
              >
                <span>
                  <strong>{user.role}</strong>
                  <span>{user.email}</span>
                </span>
                <em>Use</em>
              </button>
            ))}
          </div>
          <p className="workspace-subtle">
            Demo credentials are for local development and founder walkthroughs only.
          </p>
        </aside>
      </section>
    </main>
  );
}
