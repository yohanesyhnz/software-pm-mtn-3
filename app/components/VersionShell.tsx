import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  active: "versions" | "about";
  title: string;
  eyebrow: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function VersionShell({ active, title, eyebrow, children, actions }: Props) {
  return (
    <div className="vm-app">
      <aside className="vm-sidebar">
        <Link href="/" className="vm-brand" aria-label="Kembali ke dashboard">
          <img src="/assets/predictacore_logo.png" alt="PredictaCore" />
          <span>CMMS CONTROL</span>
        </Link>
        <nav className="vm-nav" aria-label="Navigasi CMMS">
          <Link href="/" className="vm-nav-link"><span className="vm-nav-code">01</span>Dashboard</Link>
          <Link href="/software-versions" className={`vm-nav-link ${active === "versions" ? "active" : ""}`}>
            <span className="vm-nav-code">02</span>Version Management
          </Link>
          <Link href="/about" className={`vm-nav-link ${active === "about" ? "active" : ""}`}>
            <span className="vm-nav-code">03</span>About Software
          </Link>
        </nav>
        <div className="vm-sidebar-status">
          <span className="vm-pulse" />
          <div><strong>SYSTEM ONLINE</strong><small>Production environment</small></div>
        </div>
      </aside>
      <main className="vm-main">
        <header className="vm-topbar">
          <div>
            <span className="vm-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
          </div>
          <div className="vm-topbar-actions">
            {actions}
            <div className="vm-admin-chip"><span>YA</span><div><strong>Administrator</strong><small>Full access</small></div></div>
          </div>
        </header>
        <div className="vm-content">{children}</div>
      </main>
    </div>
  );
}
