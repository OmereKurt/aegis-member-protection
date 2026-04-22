import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aegis Member Protection",
  description:
    "Case operations software for suspected elder exploitation and member protection workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link href="/" className="brand">
                <div className="brand-mark" aria-hidden="true">
                  <span className="brand-mark-text">AM</span>
                  <span className="brand-mark-accent">&gt;</span>
                </div>

                <div className="brand-text">
                  <div className="brand-title">Aegis Member Protection</div>
                  <div className="brand-subtitle">
                    Case operations for suspected elder exploitation
                  </div>
                </div>
              </Link>

              <nav className="topnav">
                <Link href="/">Home</Link>
                <Link href="/ops">Workspace</Link>
                <Link href="/reporting">Reporting</Link>
                <Link href="/pilot">Pilot Program</Link>
                <Link href="/cases/new">New Intake</Link>
              </nav>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}