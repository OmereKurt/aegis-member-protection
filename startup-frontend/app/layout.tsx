import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aegis Member Protection",
  description: "Workflow software for member protection and elder financial exploitation case handling.",
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
              <a href="/" className="brand">
                <div className="brand-mark">AM</div>
                <div className="brand-text">
                  <div className="brand-title">Aegis Member Protection</div>
                  <div className="brand-subtitle">Operational workflow for suspected elder exploitation cases</div>
                </div>
              </a>

              <nav className="topnav">
                <a href="/">Home</a>
                <a href="/ops">Operations</a>
                <a href="/reporting">Reporting</a>
                <a href="/cases/new">New Intake</a>
              </nav>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
