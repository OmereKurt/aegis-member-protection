import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AppNav from "./AppNav";
import { AuthProvider } from "./AuthProvider";

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
        <AuthProvider>
          <div className="app-shell">
            <header className="topbar">
              <div className="topbar-inner">
                <Link href="/" className="brand">
                  <div className="brand-mark" aria-hidden="true">
                    <svg className="brand-shield" viewBox="0 0 44 44" focusable="false">
                      <path
                        d="M22 4.5 36 9.2v11.4c0 8.3-5.3 15.8-14 19-8.7-3.2-14-10.7-14-19V9.2L22 4.5Z"
                        fill="currentColor"
                      />
                      <text
                        x="22"
                        y="27"
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="12"
                        fontWeight="900"
                        letterSpacing="0"
                      >
                        AM
                      </text>
                    </svg>
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

            <div className="app-body">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
