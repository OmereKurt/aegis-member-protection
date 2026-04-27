import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AppNav from "./AppNav";

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

              <div className="topbar-status" aria-label="Environment">
                <span className="status-dot" aria-hidden="true" />
                Live operations
              </div>

              <AppNav />
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
